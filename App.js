Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc3/doc/">App SDK 2.0rc3 Docs</a>'},
    launch: function() {
        //Write app code here

        // get these metrics for the previous month. 
		// TimeInProcessStoryAndDefectP50
		// TimeInProcessStoryAndDefectP75
		// TimeInProcessStoryAndDefectP95
		// TimeInProcessStoryAndDefectP99
	
		var d = new Date();

		// https://rally1.rallydev.com/insight/data?granularity=month&metrics=<list of metric names>
		//&projects=<projectID>&
		//start-date=<yyyy-mm>&end-date=<yyyy-mm>&workspaces=<workspaceID>

		var metrics = [
			"TimeInProcessStoryAndDefectP50",
			"TimeInProcessStoryAndDefectP75",
			"TimeInProcessStoryAndDefectP95",
			"TimeInProcessStoryAndDefectP99"
		];

		var project   = this.getContext().getProject()["ObjectID"];
		var workspace = this.getContext().getWorkspace()["ObjectID"];
		var lastMonth = moment().subtract(1,'months');
		var firstMonth = moment().subtract(7,'months');

		var baseUrl = "https://rally1.rallydev.com/insight/data";

		var granularity = "month";

		var url = baseUrl + "?" + "granularity=" + granularity + "" + "&metrics=" + metrics.join() + 
					"&projects=" + project + 
					"&workspaces=" + workspace + 
					"&start-date=" + firstMonth.format("YYYY-MM") + 
					"&end-date=" + lastMonth.format("YYYY-MM");

		console.log("url",url);

		Ext.Ajax.request({
		   url: url,
		   success: function(response, opts) {
		      var obj = Ext.decode(response.responseText);
		      console.dir(obj);
		   },
		   failure: function(response, opts) {
		      console.log('server-side failure with status code ' + response.status);
		   }
		});

    }
});
