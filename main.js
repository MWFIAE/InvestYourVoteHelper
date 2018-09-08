// Define a new component for the first step (input day)
// This component acts as an custom input, therefor we have a value prop as well as an "input" emiter.
Vue.component('day-step', {
	props: ['value'],
	template: '<div><q-input type="number" name="day" v-model.number="value" float-label="Tag" @change="updateDay" @keyup.enter="doNextStep" :after="after" autofocus ></q-input></div>',
	methods: {
		//Sets the localStorage for the next time we want to execute this.
		updateDay: function(){
			localStorage.setItem("day", this.value);
			this.$emit('input', this.value);
		},
		// Tells the parent to go to the next page. 
		doNextStep: function(){
			this.$emit('nextstep');
		},
	},
	data: function(){
		return {after: [{icon: 'arrow_forward', content: true, handler:()=>{this.doNextStep();}}] };
	}
})
Vue.component('previous-data-step', {
	props: ['day'],
	template: '<div style="width:100%" @keyup.enter="doNextStep">'+
				'<div style="float:left; padding-right: 10%;padding-left: 10%;width:50%">'+
					'<template v-for="item in types"><q-radio v-bind="item" v-model="type" :val="item.value" :label="item.label" @input="typeChanged"/><br /></template>'+
					'<q-uploader v-if="type==\'file\'" url="#" extensions=".csv" hide-upload-button auto-expand clearable @add="addFile"></q-uploader>'+
				'</div>'+
				'<div style="float:left;padding-right: 10%;padding-left: 10%;width:50%">'+
					'<q-scroll-area style="width: 100%; height: 50vh;">'+
						'<q-input type="textarea" v-model="value" :readonly="type!=\'text\'" :disabled="type!=\'text\'" @keyup.enter.shift.stop=""> </q-input>'+
					'</q-scroll-area>'+
					'<q-button v-if="!!value" icon="arrow_forward" @click="doNextStep" >Next</q-button>'+
				'</div>'+
			  '<div>',
	methods: {
		// Tells the parent to go to the next page. 
		doNextStep: function(){
			if(!!this.value)
				this.$emit('nextstep');
		},
		addFile: function(files){
			var file= files[0];
			console.log(file);
			var reader = new FileReader();
			reader.onload=(e)=>{
				this.value=e.target.result.replace(/,/g,"");
			}
			reader.readAsText(file);
		},
		typeChanged: function(){
			this.value="";
			if(this.type=="storage")
				this.value = localStorage.getItem("day-"+this.day);
		},
	},
	data: function(){
		var dat= {};
		var storage = !!localStorage.getItem("day-"+this.day);
		dat.types= [ {label:'Manuelle Eingabe', value:'text'},{label:'Datei', value:'file'}, ];
		
		dat.type = "text";
		if(storage){
			dat.types.push({label:'storage', value:'storage'});
			dat.type = "storage";
		}
		dat.after = [{icon: 'arrow_forward', content: true, handler: ()=>{this.doNextStep();},  }];
		dat.value = "";
		return dat;
	}
})

new Vue({
  el: '#q-app',
  data: function () {
	//Get the day from the localStorage so it doesn't need to be inputed every time.
	var day = localStorage.getItem("day");
	if(!day)
		day = 1;
	return {modal: true, day}
  },
  methods: {
	// Go to the second step on the carousel (uploading previous data)
	step2: function(){
		this.$refs.carousel.goToSlide(1);
	},
	step3: function(){
		this.$refs.carousel.goToSlide(2);
	}
  },
})