var app = null;

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    // items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc3/doc/">App SDK 2.0rc3 Docs</a>'},
    launch: function() {

        app = this;

        app.myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait..."});

        app.myMask.show();
	
		var d = new Date();

		// https://rally1.rallydev.com/insight/data?granularity=month&metrics=<list of metric names>
		//&projects=<projectID>&
		//start-date=<yyyy-mm>&end-date=<yyyy-mm>&workspaces=<workspaceID>

		var metrics = [
			// "TimeInProcessStoryAndDefectP50",
			// "TimeInProcessStoryAndDefectP75",
			// "TimeInProcessStoryAndDefectP95",
			// "TimeInProcessStoryAndDefectP99"
            "TimeInProcessStoryP50",
            "TimeInProcessStoryP75",
            "TimeInProcessStoryP95",
            "TimeInProcessStoryP99"

		];



		var project   = this.getContext().getProject()["ObjectID"];
		var workspace = this.getContext().getWorkspace()["ObjectID"];
		var lastMonth = moment(); // moment().subtract(1,'months');
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

        /* 
        endDate: "2015-01"
        granularity: "month"
        metrics: Array[4]
        scopes: Array[2]
        startDate: "2014-06"
        timePeriods: Array[7]
        */

    	var metrics = obj["metrics"];

    	// get the project scope
    	var scope = _.find(obj["scopes"],function(scope) {
    		return scope["type"] === "project";
    	});
		var months = scope["timePeriods"];

    	console.log("datapoints",scope["dataPoints"].length,"months",months);

    	return scope["dataPoints"];
    },

    showChart : function(series) {

    	console.log("series",series);

    	// console.log(_.map(series,function(s) { return s["name"];}));

        var that = this;
        
        var chart = this.down("#chart1");
        app.myMask.hide();
        if (chart !== null)
            chart.removeAll();

        var extChart = Ext.create('Rally.ui.chart.Chart', {
            // columnWidth : 1,
            itemId : "chart1",
            chartData: {
                categories : _.map(series, function(s){ return moment(s.month,"YYYY-MM").toDate()}),
                
                series : [ {
                    name : 'Cycle Times',
                    data:  _.map(series, function(s) { 
                        return {
                            // x : moment( s.month, "YYYY-MM").toDate(),
                            low : 0,
                            q1 : 0,
                            median : s.data.TimeInProcessStoryP50.value,
                            q3 : s.data.TimeInProcessStoryP75.value,
                            high : s.data.TimeInProcessStoryP99.value
                            
                            // s.data.TimeInProcessStoryAndDefectP99.value
                        };
                    }),
                    tooltip: {
                        headerFormat: '<em>Experiment No {point.key}</em><br/>'
                    }
                },
                {
                    name: 'P95',
                    color: 'black',
                    type: 'scatter',
                    data: _.map(series,function(s,i){
                        return [i,s.data.TimeInProcessStoryP95.value]
                    }),
                    marker: {
                    fillColor: 'white',
                    lineWidth: 1,
                    lineColor: 'black'
                    },
                    tooltip: {
                        pointFormat: 'Observation: {point.y:.1f}'
                    }
                }


                // {
                //     name: 'Median',
                //     type: 'column',
                //     // yAxis: 1,
                //     data: _.map(series, function(s) { return s.data.TimeInProcessStoryAndDefectP50.value;}),
                //     tooltip: {
                //         pointFormat: '<span style="font-weight: bold; color: {series.color}">{series.name}</span>: <b>{point.y:.1f}</b> '
                //     }
                // },{
                //     name: 'P75/P95/P99',
                //     type: 'errorbar',
                //     // yAxis: 1,
                //     data:  _.map(series, function(s) { 
                //         return [
                //             s.data.TimeInProcessStoryAndDefectP75.value,
                //             s.data.TimeInProcessStoryAndDefectP99.value
                //         ];}),
                //     tooltip: {
                //         pointFormat: '(range: P75 ({point.low:.1f}) - P99 ({point.high:.1f}))<br/>'
                //     }
                // }
                ]
            },

            chartConfig : {
            	// series : series,
                chart: {
					type: 'boxplot'
                },
                title: {
                text: 'Story/Defect Time In Process',
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
                            return Highcharts.dateFormat('%b %Y', Date.parse(this.value));
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
