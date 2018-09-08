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
		this.$refs.carousel.next();
	}
  },
})