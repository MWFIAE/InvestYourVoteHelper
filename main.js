
const author = 'investyourvote';
const permlink = 'day-%day%-anteilpost';
const client = new dsteem.Client('https://api.steemit.com')

Vue.use(Vuex);
const store = new Vuex.Store({
  state: {
    day: localStorage.getItem("day") || 1,
	slide: 0,
	type: "storage", 
	previous: "",
	showStorage: false,
	members: {},
	activeVotes: [],
	voteList: {}
  },
  actions:{
	async getActiveVotes({commit}){
		const content = await client.database.call('get_content', [author, permlink.replace("%day%", store.state.day)]);
		commit("setActiveVotes", content.active_votes);
	},
  },
  mutations: {
    setDay (state, day) {
		state.day = day;
		localStorage.setItem("day", day);
		
    },
	setSlide(state, slide){
		state.slide=slide;
		switch(slide){
		case 1:
			var storage= localStorage.getItem("day-"+(state.day-1))
			state.showStorage = !!storage;
			state.type = state.showStorage ?"storage":"text";
			state.previous = storage||"";
			store.dispatch('getActiveVotes')
			break;
		case 2:
			state.members = {};
			var lines = state.previous.split("\n");
			for(var i=0; i<lines.length; i++){
				split = lines[i].trim().split(" ");
				member = {name: split[0].replace("@",""), anteile: parseFloat(split[1].replace(",","."))}
				Vue.set(state.members, member.name, member);
			}
			break;
		case 3:
			var values = Object.values(state.members);
			for(var i=0; i<values.length; i++){
				var member = values[i];
				voteEntry = { name: member.name, anteile: member.anteile, comment: "", shares: 0, neueAnteile: 0 };
				var vote = state.activeVotes.find( vote=>vote.voter == member.name);
				if(!!vote){
					voteEntry.shares = vote.rshares;
					if(voteEntry.shares <= 500000000)
						voteEntry.comment="Vote not big enough";
					else{
						voteEntry.neueAnteile = parseFloat((vote.rshares / 10000000000).toFixed(3));
						voteEntry.anteile += voteEntry.neueAnteile;
					}	
				}else{
					voteEntry.comment = "Not voted";
				}
				
				Vue.set(state.voteList, member.name, voteEntry);
			}
		}
		
	},
	setType(state, type){
		state.type = type;
		state.previous="";
		if(type=="storage")
			state.previous = localStorage.getItem("day-"+(state.day-1));
	},
	setPrevious(state, previous){
		state.previous=previous;
	},
	addMember(state, name){
		if(!state.members[name])
			Vue.set(state.members,name, {name, anteile:0});
	},
	deleteMember(state, name){
		Vue.delete(state.members,name);
	},
	setActiveVotes(state, votes){
		state.activeVotes = votes;
		if(state.slide==3)
			console.log("Connection to slow!");
	}
  },
  strict: true
})

// Define a new component for the first step (input day)
// This component acts as an custom input, therefor we have a value prop as well as an "input" emiter.
Vue.component('day-step', {
	template: '<div><q-input type="number" name="day" :value="day" float-label="Tag" @input="updateDay" @keyup.enter="doNextStep" :after="after" autofocus ></q-input></div>',
	methods: {
		//Sets the localStorage for the next time we want to execute this.
		updateDay: function(message){
			store.commit("setDay", message);
		},
		// Tells the parent to go to the next page. 
		doNextStep: function(){
			store.commit("setSlide",1);
		},
	},
	data: function(){
		return {after: [{icon: 'arrow_forward', content: true, handler:()=>{this.doNextStep();}}] };
	},
	computed:{
		day(){
			return store.state.day;
		}
	}
});

Vue.component('previous-data-step', {
	template: '<div style="width:100%" @keyup.enter="doNextStep">'+
				'<div style="float:left; padding-right: 10%;padding-left: 10%;width:50%">'+
					'<template v-for="item in types"><q-radio :value="type" :val="item.value" :label="item.label" @input="typeChanged"  v-if="( item.value!=\'storage\' || showStorage)"/><br /></template>'+
					'<q-uploader v-if="type==\'file\'" url="#" extensions=".csv" hide-upload-button auto-expand clearable @add="addFile"></q-uploader>'+
				'</div>'+
				'<div style="float:left;padding-right: 10%;padding-left: 10%;width:50%">'+
					'<q-scroll-area style="width: 100%; height: 50vh;">'+
						'<q-input type="textarea" :value="previous" :readonly="type!=\'text\'" :disabled="type!=\'text\'" @input="changePrevious" @keyup.enter.shift.stop=""> </q-input>'+
					'</q-scroll-area>'+
					'<q-button v-if="!!previous" icon="arrow_forward" text-color="primary" @click="doNextStep" >Next</q-button>'+
				'</div>'+
			  '<div>',
	methods: {
		// Tells the parent to go to the next page. 
		doNextStep: function(){
			if(!!this.previous)
				store.commit("setSlide",2);
		},
		addFile: function(files){
			var file= files[0];
			console.log(file);
			var reader = new FileReader();
			reader.onload=(e)=>{
				store.commit("setPrevious", e.target.result.replace(/,/g,""));
			}
			reader.readAsText(file);
		},
		typeChanged: function(type){
			store.commit("setType", type);
		},
		changePrevious: function(previous){
			store.commit("setPrevious", previous);
		}
	},
	data: function(){
		var dat= {};
		dat.types= [ {label:'Lokal Storage', value:'storage'}, {label:'Manuelle Eingabe', value:'text'},{label:'Datei', value:'file'}, ];
		dat.after = [{icon: 'arrow_forward', content: true, handler: ()=>{this.doNextStep();},  }];
		return dat;
	},
	computed:{
		type(){
			return store.state.type;
		},
		previous(){
			return store.state.previous;
		},
		showStorage(){
			return store.state.showStorage;
		}
	}
});

Vue.component('member-list-step', {
	template: 	'<div style="width: 30vw" @keyup.enter="doNextStep">'+
					'<q-field><q-input  type="text" name="currname" v-model="currname" float-label="Name" @keyup.enter="addMember" :after="after"></q-input></q-field>'+
					'<q-scroll-area style="width: auto; height: 90vh;">'+
						'<table  style="white-space:nowrap;">'+
							'<tr>'+
								'<th>Name</th>'+
								'<th>Anteile</th>'+
							'</tr>'+
							'<tr v-for="member in members">'+
								'<td>{{member.name}}</td>'+
								'<td>{{member.anteile.toFixed(3)}}</td>'+
								'<td><q-btn @click="deleteMember(member.name)" icon="clear" size="s" text-color="primary"> </q-btn></td>'+
							'</tr>'+
						'</table>'+
					'</q-scroll-area>'+
					'<q-button icon="arrow_forward" text-color="primary" @click="doNextStep" >Next</q-button>'+
				'</div>',
	methods: {
		// Tells the parent to go to the next page. 
		doNextStep: function(){
			store.commit("setSlide",3);
		},
		addMember: function(){
			store.commit("addMember", this.currname);
			this.currname="";
		},
		deleteMember: function(name){
			store.commit("deleteMember", name);
		},
	},
	data: function(){
		var dat= {};
		dat.currname ="";
		dat.after = [{icon: 'add', content: true, handler: ()=>{this.addMember();},  }];
		return dat;
	},
	computed:{
		members(){
			return store.state.members;
		}
	}
});
Vue.component('share-list', {
	template: 	'<div style="width: 50vw">'+
					'<q-scroll-area style="width: auto; height: 90vh;">'+
						'<table  style="white-space:nowrap;">'+
							'<tr>'+
								'<th>Name</th>'+
								'<th>Anteile</th>'+
								'<th>Neue Anteile</th>'+
								'<th>Vote-Rshares</th>'+
								'<th>Kommentar</th>'+
							'</tr>'+
							'<tr v-for="entry in voteList">'+
								'<td>{{entry.name}}</td>'+
								'<td>{{entry.anteile.toFixed(3)}}</td>'+
								'<td>{{entry.neueAnteile.toFixed(3)}}</td>'+
								'<td>{{entry.shares}}</td>'+
								'<td>{{entry.comment}}</td>'+
							'</tr>'+
						'</table>'+
					'</q-scroll-area>'+
				'</div>',
	methods: {
		// Tells the parent to go to the next page. 
		doNextStep: function(){
			store.commit("setSlide",3);
		},
		addMember: function(){
			store.commit("addMember", this.currname);
			this.currname="";
		},
		deleteMember: function(name){
			store.commit("deleteMember", name);
		},
	},
	data: function(){
		var dat= {};
		dat.currname ="";
		dat.after = [{icon: 'add', content: true, handler: ()=>{this.addMember();},  }];
		return dat;
	},
	computed:{
		voteList(){
			return store.state.voteList;
		}
	}
});

new Vue({
	el: '#q-app',
	store, 
	data: function () {
		return {modal: true}
	},
	computed:{
		slide(){
			return store.state.slide;
		}
	}
})