/////////////////////////////////////////////
//////////////// Class Tree /////////////////
/////////////////////////////////////////////


var tree = function() {
	/* Call to the parent constructor */
	EzWebGadget.call(this, {translatable: false});
}

tree.prototype = new EzWebGadget(); /* Extend from EzWebGadget */
tree.prototype.resourcesURL = "http://localhost/gadgets/repository-tree/";

/******************** OVERWRITE METHODS **************************/
tree.prototype.init = function() {

	// Initialize EzWeb variables

	this.repository = "";							// Name of repository
	this.url = "";								// URL to REST API
	this.tree= "";
	this.is_configured = false;						// True if repository and URL are set, false otherwise

	this.ChangeDir = false;

	this.github = false;

//	this.reset_tree;

	this.showed_tree = new dTree('showed_tree');
	this.ident = 1;
	this.pid = 0;

	this.showed_tree.config.folderlinks = false;
	this.showed_tree.config.useStatusText = true;
	this.showed_tree.config.useCookies = false;
	//Tree.config.inOrder = true;
	this.showed_tree.add(0,-1,'Repository Tree');


	this.slotTree = EzWebAPI.createRGadgetVariable("slotTree", this.setTree);	// Get tree
	this.slotRepository = EzWebAPI.createRGadgetVariable("slotRepository", this.setRepository);	// get repository name
	this.slotURL = EzWebAPI.createRGadgetVariable("slotURL", this.setURL);	// get api url

	this.eventRepository = EzWebAPI.createRWGadgetVariable("eventRepository");		// Send repository name to other gadgets
	this.eventURL = EzWebAPI.createRWGadgetVariable("eventURL");		// Send "URL" to other gadgets
	this.eventFile = EzWebAPI.createRWGadgetVariable("eventFile");		// Send a commit's tree SHA1 key to other gadgets.

	this.saved_repository = EzWebAPI.createRWGadgetVariable("saved_repository");	// Saved property repository name
	this.saved_url = EzWebAPI.createRWGadgetVariable("saved_url");	// Saved property URL
	this.saved_tree = EzWebAPI.createRWGadgetVariable("saved_tree");	// Saved property Tree id

	// CONSTANTS. Webpage alternatives (different views)

	this.MAIN_ALTERNATIVE       = 0;
	this.CONFIG_ALTERNATIVE     = 1;

	// User Interface

	this.alternatives = new StyledElements.StyledAlternatives({defaultEffect:"None"});

	// Initialize Main Alternative (view)

	this.mainAlternative = this.alternatives.createAlternative();
  
    	this.restore();				// Load Saved configuration
	this.createUserInterface();		// Create User Interface
	this.reload();				// Reload Gadget
}



tree.prototype.createUserInterface = function() {

	var body = document.getElementsByTagName("body")[0];

	// Header (Alternative Switcher)

	var header = document.createElement("div");
	header.id = "header";
	body.appendChild(header);

	var header_left = document.createElement("div");
	header_left.id = "header_left";
	header.appendChild(header_left);
	
	header_left.appendChild(this._createHeaderButton("images/view.png", "View Repository", EzWebExt.bind(function() { 
		this.alternatives.showAlternative(this.MAIN_ALTERNATIVE);
		this.reload();
	}, this)));
	header_left.appendChild(this._createHeaderButton("images/config.png", "Settings", EzWebExt.bind(function() { 
		this.alternatives.showAlternative(this.CONFIG_ALTERNATIVE);
		this.repaint();
	}, this)));


	var content = document.createElement("div");
	content.id = "content";
	body.appendChild(content);
	
	// CONFIGURATION ALTERNAVITE

	var configAlternative = this.alternatives.createAlternative();
	var config_content = document.createElement("div");
       
        configAlternative.appendChild(config_content);
        
        headerrow = document.createElement("div");
        config_content.appendChild(headerrow);
        
        var row = document.createElement("div");
	
	var title = document.createElement("span");
	title.appendChild(document.createTextNode("SETTINGS"));
	
	row.appendChild(title);
	row.appendChild(this._createHeaderButton("images/save.png", "Save", EzWebExt.bind(function() { 
		if (
			this.form_config &&
			this.form_config["repository"].getValue() != "" &&
			this.form_config["url"].getValue() != "" &&
			this.form_config["tree"].getValue() != ""){
		
			this.saveForm();
			this.reload();
		}
		else {
			this.alert("Error", "Must fill all form fields", {type: EzWebExt.ALERT_WARNING});
		}
	}, this)));

       	headerrow.appendChild(row);
       
       	tablebody = document.createElement("div");
       	config_content.appendChild(tablebody);
	
       	var config_body = document.createElement("div");
	tablebody.appendChild(config_body);  
        
       	this.form_config = {};

	var repository_text = new StyledElements.StyledTextField();
	var url_text = new StyledElements.StyledTextField();
	var tree_text = new StyledElements.StyledTextField();
	
	this.form_config["repository"] = repository_text;
	this.form_config["url"] = url_text;
	this.form_config["tree"] = tree_text;

       	row = document.createElement("div");
	row.appendChild(this._createCell(document.createTextNode("Repository" + ":"), "title"));
	row.appendChild(this._createCell(repository_text, "value"));
	if (this.is_configured) {
		this.form_config["repository"].setValue(this.repository);
	}
	config_body.appendChild(row);
	
	row = document.createElement("div");
	row.appendChild(this._createCell(document.createTextNode("Url" + ":"), "title"));
	row.appendChild(this._createCell(url_text, "value"));
	if (this.is_configured) {
		this.form_config["url"].setValue(this.url);
	}
	config_body.appendChild(row);

	row = document.createElement("div");
	row.appendChild(this._createCell(document.createTextNode("Tree" + ":"), "title"));
	row.appendChild(this._createCell(tree_text, "value"));
	if (this.is_configured) {
		this.form_config["tree"].setValue(this.tree);
	}
	config_body.appendChild(row);

	// If there are Saved settings, load Commits Alternative, else, it displays the configuration alternative.

	

	// Main alternative

	var tree_content = document.createElement("div");
	tree_content.id = "tree";
	this.mainAlternative.appendChild(tree_content);
   


	if(this.is_configured) {
		this.getTree();  // Hay que pasar los parametros???
	}

	this.alternatives.insertInto(content);


}

tree.prototype.reset_tree = function() {

	this.showed_tree = new dTree('showed_tree');
	this.ident = 1;
	this.pid = 0;

	this.showed_tree.config.folderlinks = false;
	this.showed_tree.config.useStatusText = true;
	this.showed_tree.config.useCookies = false;
	//Tree.config.inOrder = true;
	this.showed_tree.add(0,-1,'Repository Tree');


}


tree.prototype._createHeaderButton = function(src, title, handler) {
	var div = document.createElement("div");
	EzWebExt.addClassName(div, "image");
	
	var img = document.createElement("img");
	img.src = this.getResourceURL(src);
	img.title = title;
	img.addEventListener("click", handler, false);
	div.appendChild(img);

	return div
}


tree.prototype.repaint = function() {
	var height = (document.defaultView.innerHeight - document.getElementById('header').offsetHeight);
	document.getElementById('content').style.height = height + 'px';
	this.alternatives.repaint();

}

tree.prototype.reload = function () {

	if(this.is_configured) {
		this.alternatives.showAlternative(this.MAIN_ALTERNATIVE);
	}
	else {
		this.alternatives.showAlternative(this.CONFIG_ALTERNATIVE);
	}

	this.repaint;

}


tree.prototype._createCell = function(element, className) {
	var cell = document.createElement("div");
	var span = document.createElement("span");
	if (element instanceof StyledElements.StyledElement) {
		element.insertInto(span);
	}
	else {
		span.appendChild(element);
	}
	cell.appendChild(span);
	return cell;
}



tree.prototype.saveForm = function() {
	this.repository = this.form_config["repository"].getValue();
	this.url = this.form_config["url"].getValue();
	this.tree = this.form_config["tree"].getValue();
	this.is_configured = true;
	this.save();
	this.reload();
	
	this.reset_tree;

	this.getTree();
}


tree.prototype.save = function() {


	this.saved_repository.set(this.repository+";"+this.github);
	this.saved_url.set(this.url);
	this.saved_tree.set(this.tree);

		// Save github status
	
}

tree.prototype.restore = function() {

	if(this.saved_repository.get()!="") {

		var data = this.saved_repository.get().split(';');

		if (data.length == 3)
		{
			this.repository = data[0]+";"+data[1];
			this.github = true;
		}
		else
		{
			this.repository = data[0];
			this.github = false;
		}

		this.tree = this.saved_tree.get();
		this.url = this.saved_url.get();
		this.is_configured = true;

	}

		// restore github status

}

tree.prototype.getTree = function() {

	if (this.github) {

		var user = this.repository.split(';')[0];
		var repo = this.repository.split(';')[1];

		this.sendGet(this.url+"?github=1&repository="+repo+"&user="+user+"&op=4&tree="+this.tree, this.displayTree, this.displayError, this.displayException);


	}
	else {

		this.sendGet(this.url+"?github=0&repository="+this.repository+"&op=4&tree="+this.tree, this.displayTree, this.displayError, this.displayException);

	}


}

tree.prototype.displayTree = function(resp) {

	this.save();

	var resp_json = eval('(' + resp.responseText + ')');

	this.build_tree(resp_json, this.pid);

	document.getElementById('tree').innerHTML = "";

        if (this.ChangeDir) {
                this.ChangeDir = false;
        }

	document.getElementById('tree').innerHTML = this.showed_tree;

}


tree.prototype.build_tree = function(resp_json, local_pid) {

        var n_nodos = resp_json.length;
        var nodo = "node";

        for (i=1;i<=n_nodos;i++)
        {
                nodo = "node" + i;

		// Aquí hay que usar RESOURCES URL!


		if (resp_json[nodo].type=="tree") {
			this.showed_tree.add(this.ident, local_pid, resp_json[nodo].name, resp_json[nodo].id, null ,null,'http://localhost/gadgets/repository-tree/img/folder.gif','http://localhost/gadgets/repository-tree/img/folderopen.gif', false, true);
			this.ident+=1;

		}
		else{
			this.showed_tree.add(this.ident, local_pid, resp_json[nodo].name, resp_json[nodo].id);
			this.ident+=1;
		}

        }


}


tree.prototype.displayError = function() {

	this.alert("Error", "No se puede acceder al repositorio", EzWebExt.ALERT_ERROR);
}


tree.prototype.displayException = function() {

	this.alert("Exception", "exception", EzWebExt.ALERT_ERROR);
}



tree.prototype.setURL = function(msg) {

	tree.url = msg;
}

tree.prototype.setRepository = function(msg) {

	var data = msg.split(';');

	if (data.length == 3)
	{
		tree.repository = data[0]+";"+data[1];
		tree.github = true;
	}
	else
	{
		tree.repository = data[0];
		tree.github = false;
	}

}

tree.prototype.setTree = function(msg) {

	tree.tree = msg;
	tree.reset_tree();

	tree.getTree();

	tree.reload();
}

tree.prototype.ExpandTree = function(tree_id, pid_local) {

	this.pid=pid_local;
	this.ChangeDir=true;

	if (this.github) {

		var user = this.repository.split(';')[0];
		var repo = this.repository.split(';')[1];

		this.sendGet(this.url+"?github=1&repository="+repo+"&user="+user+"&op=4&tree="+tree_id, this.displayTree, this.displayError, this.displayException);

	}
	else {

		this.sendGet(this.url+"?github=0&repository="+this.repository+"&op=4&tree="+tree_id, this.displayTree, this.displayError, this.displayException);
	}
}

tree.prototype.Send_file = function(blob_id, filename) {

	this.eventRepository.set(this.saved_repository.get());
	this.eventURL.set(this.saved_url.get());
	var blob_name = blob_id + ";" + filename;
	this.eventFile.set(blob_name);

}


/* Instanciate the Gadget class */
tree = new tree();

