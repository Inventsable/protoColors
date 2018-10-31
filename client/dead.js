
// Vue.component('sort-by', {
//   template: `
//     <div class="headerSortBy">
//       <div :class="sortByClass('Recent')" @click="toggleDef(true)"></div>
//       <div :class="sortByClass('Spectrum')" @click="toggleDef(false)"></div>
//     </div>
//   `,
//   data() {
//     return {
//       isDefault: true,
//     }
//   },
//   computed: {
//     isRecent: function(){return (this.isDefault) ? true : false},
//     isSpectrum: function(){return !this.isRecent},
//   },
//   methods: {
//     toggleDef(state) {
//       if (state !== this.isDefault)
//         this.isDefault = !this.isDefault;
//     },
//     sortByClass(name) {
//       var style = 'sortBy-' + name + '-';
//       if (((this.isDefault) && (name == 'Recent'))
//       || ((!this.isDefault) && (name == 'Spectrum'))) {
//         style += 'Active'
//       } else {
//         style += 'Idle'
//       }
//       return style;
//     },
//   }
// })

// DEPRECATED
Vue.component('handle', {
  props: ['enabled'],
  template: `
    <div
      v-mousemove-outside="onMouseOutside"
      @mousedown="startDrag"
      @mouseup="endDrag"
      class="bodyHandle"
      v-if="enabled">
      <div class="bodyHandleDiv"></div>
    </div>
  `,
  data() {
    return {
      canHandle: false,
      canDrag: false,
      isDragging: false,
      startY: 0,
      startH: 0,
      endH: 0,
    }
  },
  methods: {
    onMouseOutside(evt, el) {
      if ((this.canDrag) && (this.isDragging) && (this.canHandle)) {
        // Needs subtraction logic
        var res = (this.startY - evt.clientY) * -1;
        console.log(res)
        var body = el.parentNode.children[0];
        var style = this.$root.getCSS('swatchList-height');
        var newDim = this.startH + res;
        if  (((res > 0) && (newDim < 240)) || ((res < 0) && (newDim > this.startY))) {
          console.log(`${this.startY} - ${evt.clientY} = ${body.clientHeight} + ${res} = ${newDim}, css: ${style}`);
          this.$root.setCSS('swatchList-height', newDim + 'px')
          this.endH = newDim;
        }
      }
    },
    startDrag(evt) {
      if (!this.isDragging)
        this.isDragging = true;
      if (this.isDragging)
        this.startY = evt.clientY;
      console.log(`Starting at ${this.startY}`);
    },
    endDrag(evt, opt) {
      // console.log('Ending drag');
      this.isDragging = false;
      // console.log(`${this.startH} : ${this.endH}`);
      this.startH = this.endH;
    },
    getHeight() {
      var swatchList = document.getElementById('bodySwatchList');
      this.startH = swatchList.clientHeight;
    },
  },
  mounted() {
    var self = this;
    Event.$on('endDragEvt', self.endDrag)
    console.log(this.canHandle);
    var swatchList = document.getElementById('bodySwatchList');
    if (this.canHandle) {
      this.$root.setCSS('swatchList-height', swatchList.clientHeight + 4 + 'px')
      this.getHeight();
    }
  }
})
