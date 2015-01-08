var app = null;

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc3/doc/">App SDK 2.0rc3 Docs</a>'},
    launch: function() {

        app = this;

        app.myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait..."});

        app.myMask.show();
	
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
		      var series = app.createSeriesFromObject(obj);
		      app.showChart(series);
		   },
		   failure: function(response, opts) {
		      console.log('server-side failure with status code ' + response.status);
		   }
		});

    },

    createSeriesFromObject : function(obj) {

    	var metrics = obj["metrics"];

    	// get the project scope
    	var scope = _.find(obj["scopes"],function(scope) {
    		return scope["type"] === "project";
    	});
		var months = scope["months"];

    	console.log("datapoints",scope["dataPoints"].length);

    	var series = [];
    	series.push({name:"label", data : _.map(months,function(m){ return moment(m,"YYYY-MM").toDate()})});

    	_.each(metrics,function(metric){
    		series.push({
    			name:metric, 
    			data: _.map(scope["dataPoints"],function(point) {
    				return Math.round(point["data"][metric]["value"]*100)/100;
    			})
    		})
    	});

    	return series;
    },

    showChart : function(series) {

    	console.log("series",series);

    	console.log(_.map(series,function(s) { return s["name"];}));

        var that = this;
        
        var chart = this.down("#chart1");
        app.myMask.hide();
        if (chart !== null)
            chart.removeAll();

        var extChart = Ext.create('Rally.ui.chart.Chart', {
            // columnWidth : 1,
            itemId : "chart1",
            chartData: {
                categories : series[0].data,
                series : series.slice(1, series.length)
            },

            chartConfig : {
            	// series : series,
                chart: {
					// type: 'boxplot'
                },
                title: {
                text: 'Story/Defect Cycle Time',
                x: -20 //center
                },
                plotOptions: {
                    series: {
                        marker: {
                            radius: 2
                        }
                    }
                },
                xAxis: {
                    type: 'datetime',
                    labels: {
                        formatter: function() {
                            return Highcharts.dateFormat('%b', Date.parse(this.value));
                        }
                    }
                },
                yAxis: {
                    title: {
                        text : 'Days'
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                tooltip: {
                },
                legend: { align: 'center', verticalAlign: 'bottom' }
            }
        });
        this.add(extChart);
        chart = this.down("#chart1");
        var p = Ext.get(chart.id);
        elems = p.query("div.x-mask");
        _.each(elems, function(e) { e.remove(); });
        var elems = p.query("div.x-mask-msg");
        _.each(elems, function(e) { e.remove(); });

    }



});
