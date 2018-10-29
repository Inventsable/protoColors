var csInterface = new CSInterface();
loadUniversalJSXLibraries();
loadJSX('host.jsx');
window.Event = new Vue();

Vue.component('proto-colors', {
  template: `
    <div class="appGrid" @mouseover="wakeApp" @mouseout="sleepApp">
      <div class="mainTop">
        <head-main></head-main>
        <body-main></body-main>
      </div>
      <footer-main></footer-main>
    </div>
  `,
  methods: {
    wakeApp(evt) {
      this.$root.wake();
    },
    sleepApp(evt) {
      this.$root.sleep();
      Event.$emit('clearMods');
    }
  }
})

Vue.component('head-main', {
  template: `
    <div class="headerMain bbox">
      <sort-by></sort-by>
      <scanner></scanner>
      <visualizers></visualizers>
    </div>
  `,
})

Vue.component('sort-by', {
  template: `
    <div class="headerSortBy">
      <div :class="sortByClass('Recent')" @click="toggleDef(true)"></div>
      <div :class="sortByClass('Spectrum')" @click="toggleDef(false)"></div>
    </div>
  `,
  data() {
    return {
      isDefault: true,
    }
  },
  computed: {
    isRecent: function(){return (this.isDefault) ? true : false},
    isSpectrum: function(){return !this.isRecent},
  },
  methods: {
    toggleDef(state) {
      if (state !== this.isDefault)
        this.isDefault = !this.isDefault;
    },
    sortByClass(name) {
      var style = 'sortBy-' + name + '-';
      if (((this.isDefault) && (name == 'Recent'))
      || ((!this.isDefault) && (name == 'Spectrum'))) {
        style += 'Active'
      } else {
        style += 'Idle'
      }
      return style;
    },
  }
})

Vue.component('selection-colors', {
  template: `
    <div class="headerInSelection bbox">
      <div class="inSelectionGrid" :style="'grid-template-columns: repeat(' + this.selection.length + ', 1fr);'">
        <div v-for="swatch in selection" :class="getSwatchClass(swatch)" :style="getSwatchStyle(swatch)"></div>
      </div>
    </div>
  `,
  data() {
    return {
      selection: [{
        key: 0,
        value: '#3d3d3d'
      }]
    }
  },
  mounted() {
    var self = this;
    Event.$on('clearSelection', self.clearSelection)
    Event.$on('updateSelection', self.updateSelection)
    Event.$on('updateSelectedColors', self.getUniqueColors)
  },
  methods: {
    getUniqueColors(array) {
      var allColors = [];
      for (var i = 0; i < array.length; i++) {
        if (array[i].fill !== 'none')
          allColors.push(array[i].fill)
        if (array[i].stroke !== 'none')
          allColors.push(array[i].stroke)
      }
      var results = this.$root.removeDuplicatesInArray(allColors);
      this.constructSelection(results);
    },
    gridStyle() {
      var style = '';
      if (this.selection.length)
        style = 'grid-template-columns: repeat(' + this.selection.length + ', 1fr);'
      else
        style = 'grid-template-columns: repeat(0, 1fr);'
      return style;
    },
    updateSelection(array) {
      if (array.length) {
        console.log('There is a selection');
        Event.$emit('checkSelectedColors', array)
      } else {
        console.log('No selection');
        this.clearSelection();
      }
      console.log(array);
    },
    getSwatchClass(swatch) {
      return 'inSelectionCell'
    },
    getSwatchStyle(swatch) {
      return 'background-color: ' + swatch.value + ';'
    },
    clearSelection() {
      this.selection = [];
    },
    constructSelection(array) {
      // console.log('Constructing');
      var self = this, valid = true;
      this.clearSelection();
      if (!/./.test(array)) {
        valid = false;
      }
      if (valid) {
        array.forEach(function(v,i,a) {
          var child = {
            key: Number(i),
            value: v,
          }
          self.selection.push(child);
        });
      }
    },
  }
})

Vue.component('scanner', {
  template: `
    <div class="visualizerScanning">
      <div
        :class="(isScanning) ? 'visualizerScanning-Active' : 'visualizerScanning-Idle'"
        @click="toggleScans"></div>
    </div>
  `,
  data() {
    return {
      isScanning: false,
      lastSelection: [],
      timer: {
        selection: null,
        color: null,
        fillActive: null,
      },
      lastFillStroke: {
        fill: {
          active: true,
          color: 'white',
        },
        stroke: {
          active: false,
          color: 'black',
        }
      }
    }
  },
  methods: {
    scanClass() {
      var style = 'visualizerScanning-'
      if (this.isScanning) {
        style += 'Active'
      } else {
        style += 'Idle'
      }
      return style;
    },
    selectionRead(msg) {
      // msg is CSV of pageItem.index
      if (msg !== this.lastSelection) {
        var result = [];
        if (!/./.test(msg)) {
          result = [];
        } else if (/\,/.test(msg)) {
          result = msg.split(',');
        } else {
          result = [msg];
        }
        this.lastSelection = msg;
        Event.$emit('updateSelection', result)
      }
    },
    selectionCheck() {
      var self = this;
      csInterface.evalScript(`scanSelection()`, self.selectionRead)
    },
    scanSelection(state) {
      var self = this;
      if (state)
        this.timer.selection = setInterval(self.selectionCheck, 500);
    },
    stopSelectionScan() {
      clearInterval(this.timer.selection);
    },
    toggleSelectionScan(e) {
      this.isScanning = !this.isScanning;
      if (this.isScanning) {
        this.scanSelection(this.isScanning);
      } else {
        this.stopSelectionScan();
      }
      console.log(`Selection is ${this.isScanning}`);
    },
    fillstrokeRead(msg) {
      var last = this.lastFillStroke;
      if (/\,/.test(msg))
        msg = JSON.parse(msg);
      if (!this.sameFillStroke(msg, last)) {
        console.log('Fillstroke changed');
        Event.$emit('updateFillStroke', msg)
        this.lastFillStroke = msg;
      }
    },
    sameFillStroke(a, b) {
      var results = true;
      for (let [key, value] of Object.entries(a)) {
        for (let [index, data] of Object.entries(a[key])) {
          if (a[key][index] !== b[key][index])
            results = false;
        }
      }
      // console.log(results);
      return results;
    },
    fillstrokeCheck() {
      var self = this;
      csInterface.evalScript(`scanFillStroke()`, self.fillstrokeRead)
    },
    scanFillStroke(state) {
      var self = this;
      if (state)
        this.timer.fillstroke = setInterval(self.fillstrokeCheck, 100);
    },
    stopFillStrokeScan() {
      clearInterval(this.timer.fillstroke);
    },
    toggleFillStrokeScan(e) {
      // this.isScanning = !this.isScanning;
      if (this.isScanning)
        this.scanFillStroke(this.isScanning);
      else
        this.stopFillStrokeScan();
      console.log(`Fillstroke is ${this.isScanning}`);
    },
    toggleScans() {
      this.toggleSelectionScan()
      this.toggleFillStrokeScan()
      if (!this.isScanning) {
        this.stopFillStrokeScan();
        this.stopSelectionScan();
      }
    }
  },
  mounted() {
    this.toggleScans();
    // this.toggleSelectionScan();
    // this.toggleFillStrokeScan();
  }
})

Vue.component('fill-stroke', {
  template: `
    <div class="visualizerFillStroke bbox">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect class="fillstroke-bg" width="100" height="100"/>
        <g id="fill" v-if="!isFillActive">
          <rect class="fillstroke-mask" x="11" y="11" width="52" height="52"/>
          <rect class="fillstroke-fill" x="11" y="11" width="52" height="52"/>
          <line v-if="!master.fill.hasColor" class="fillstroke-cancel" x1="11" y1="63" x2="63" y2="11"/>
          <rect class="fillstroke-fill-frame" x="11" y="11" width="52" height="52"/>
        </g>
        <g id="stroke">
          <rect class="fillstroke-mask" x="37" y="37" width="52" height="52"/>
          <rect class="fillstroke-stroke" :style="strokeStyle" x="37" y="37" width="52" height="52"/>
          <rect class="fillstroke-bg" x="50.91" y="50.91" width="24.18" height="24.18"/>
          <rect class="fillstroke-stroke-frame" x="50.91" y="50.91" width="24.18" height="24.18"/>
          <line v-if="!master.stroke.hasColor" class="fillstroke-cancel" x1="37" y1="89" x2="89" y2="37"/>
          <rect class="fillstroke-stroke-frame" x="37" y="37" width="52" height="52"/>
        </g>
        <g id="fill" v-if="isFillActive">
          <rect class="fillstroke-mask" x="11" y="11" width="52" height="52"/>
          <rect class="fillstroke-fill" :style="fillStyle" x="11" y="11" width="52" height="52"/>
          <line v-if="!master.fill.hasColor" class="fillstroke-cancel" x1="11" y1="63" x2="63" y2="11"/>
          <rect class="fillstroke-fill-frame" x="11" y="11" width="52" height="52"/>
        </g>
      </svg>
    </div>
  `,
  data() {
    return {
      master: {
        fill: {
          active: true,
          color: 'white',
        },
        stroke: {
          active: false,
          color: 'none',
        },
      },
    }
  },
  computed: {
    isFillActive: function() {
      if (this.master.fill.active)
        return true;
      else
        return false;
    }
  },
  methods: {
    setFillStroke(msg) {
      this.master = msg;
      this.$root.setCSS('color-def-stroke', msg.stroke.color);
      this.$root.setCSS('color-def-fill', msg.fill.color);
      this.setFillStrokeFrames();
      this.$root.isFillActive = this.isFillActive;
    },
    setFillStrokeFrames() {
      if (this.isLightColor(this.master.fill.color))
        this.$root.setCSS('color-def-fill-frame', '#1f1f1f')
      else
        this.$root.setCSS('color-def-fill-frame', '#a1a1a1')
      if (this.isLightColor(this.master.stroke.color))
        this.$root.setCSS('color-def-stroke-frame', '#1f1f1f')
      else
        this.$root.setCSS('color-def-stroke-frame', '#a1a1a1')
    },
    isLightColor(hex) {
      var result;
      if (!/white/.test(hex)) {
        var hex = hex.substring(1), rgb = parseInt(hex, 16);
        var r = (rgb >> 16) & 0xff, g = (rgb >>  8) & 0xff, b = (rgb >>  0) & 0xff;
        var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (luma < 40)
          result = false;
        else
          result = true;
      } else {
        result = true;
      }
      return result;
    },
    strokeStyle() {
      var str = 'fill: ' + this.stroke.color + ';'
      return str;
    },
    fillStyle() {
      var str = '';
      if (this.master.fill.hasColor)
        str = 'fill: red'
      return str;
    }
  },
  mounted() {
    var self = this;
    Event.$on('updateFillStroke', self.setFillStroke)
  }
})

Vue.component('visualizers', {
  template: `
    <div class="headerVisualizers bbox">
      <mod-keys></mod-keys>
      <fill-stroke/>
      <selection-colors></selection-colors>
    </div>
  `,
  data() {
    return {
      msg: 'hello',
    }
  }
})

Vue.component('mod-keys', {
  template: `
    <div v-mousemove-outside="onMouseOutside" class="visualizerModKeys" :style="'grid-template-columns: repeat(' + this.activeList.length + ', 1fr);'">
      <div v-for="modKey in activeList" :class="getModKeyClass(modKey)"></div>
    </div>
  `,
  data() {
    return {
      activeList: [
        { name: 'Ctrl' },
        { name: 'Shift' },
        { name: 'Alt' },
      ],
      Shift: false,
      Ctrl: false,
      Alt: false,
    }
  },
  mounted() {
    var self = this;
    this.activeMods();
    Event.$on('updateModsUI', self.updateMods);
    Event.$on('clearMods', self.clearMods);
  },
  methods: {
    activeMods() {
      var mirror = [], child = {};
      if (this.Ctrl) {
        child = {name: 'Ctrl', key: 0}
        mirror.push(child);
      }
      if (this.Shift) {
        child = {name: 'Shift', key: 1}
        mirror.push(child);
      }
      if (this.Alt) {
        child = {name: 'Alt', key: 2}
        mirror.push(child);
      }
      this.activeList = mirror;
    },
    clearMods() {
      this.Shift = false;
      this.Alt = false;
      this.Ctrl = false;
      this.activeList = [];
    },
    updateMods() {
      // console.log('Updating mods');
      this.Ctrl = this.$root.mods.Ctrl;
      this.Shift = this.$root.mods.Shift;
      this.Alt = this.$root.mods.Alt;
      this.activeMods();
    },
    getModKeyClass(type) {
      var style =  'modKey-' + type.name + '-'
      return style += 'Active';
    },
    onMouseOutside(e, el) {
      // console.log('Checking mods');
      this.$root.parseModifiers(e);
    },
  },
  computed: {
    isDefault: function() {return this.$root.isDefault},
  },
})

Vue.component('body-main', {
  template: `
    <div @mouseover="restrictHandle" @mouseup="endDrag" class="bodyMain">
      <div id="bodySwatchList" class="bodySwatches" @mouseout="swatchRangeOut">
        <swatch-list :model="swatchList.byTime"></swatch-list>
      </div>
      <handle :enabled="canHandle"></handle>
    </div>
  `,
  data() {
    return {
      canHandle: false,
      sorted: 'byTime',
      swatchList: {
        byTime: [
          {
            key: 0,
            value: '#ff0000',
            showPrefix: false,
            isActive: true,
            isHover: false,
            isFind: false,
            isReplace: false,
          },
          {
            key: 1,
            value: '#00ff00',
            showPrefix: false,
            isActive: false,
            isHover: false,
            isFind: false,
            isReplace: false,
          },
          {
            key: 2,
            value: '#0000ff',
            showPrefix: false,
            isActive: false,
            isHover: false,
            isFind: false,
            isReplace: false,
          }
        ],
      }
    }
  },
  mounted() {
    var self = this;
    Event.$on('swatchClearHoverEvt', self.clearSwatchesHover);
  },
  methods: {
    swatchRangeOut(evt) {
      try {
        if (evt.toElement.className !== 'swatch')
        this.clearSwatchesHover();
      } catch(e) {return}
    },
    clearSwatchesHover(except) {
      var which = this.sorted
      var target = this.swatchList[which];
      for (var i = 0; i < target.length; i++) {
        target[i].isHover = false;
      }
    },
    endDrag() {
      Event.$emit('endDragEvt')
    },
    restrictHandle(evt) {
      if ((evt.clientY > 96) && (evt.clientY < 340))
        this.canDrag = true;
      else
        this.canDrag = false;
      if (!this.canDrag) {
        this.endDrag();
        // console.log('Exiting');
      }
    },
  }
})

Vue.component('swatch-list', {
  props: {
    model: Array,
  },
  computed: {
    isDefault: function() { return this.$root.isDefault },
  },
  template: `
    <div class="swatchList bbox">
      <div v-for="swatch in model"
        @mouseover="showPrefix(swatch)"
        @mouseout="hidePrefix(swatch)"
        @click="currentAction(swatch)"
        :class="getSwatchClass(swatch)"
        :style="getSwatchStyle(swatch)">
          <div :class="prefixClass(swatch)" :style="prefixStyle(swatch)">
            <swatch-icon v-if="!isDefault" :model="swatch"></swatch-icon>
          </div>
          <div class="swatchSuffix" :style="suffixStyle(swatch)"></div>
      </div>
    </div>
  `,
  methods: {
    hasHandle(swatch, result=false) {
      for (let [key,value] of Object.entries(swatch))
        if (swatch[key])
          result = true;
      return result;
    },
    currentAction(swatch) {
      if (this.$root.isDefault) {
        if (this.$root.isFillActive) {
          // console.log(`${swatch.value} to fill`);
          csInterface.evalScript(`setDefaultFill('${swatch.value}')`)
        } else {
          // console.log(`${swatch.value} to stroke`);
          csInterface.evalScript(`setDefaultStroke('${swatch.value}')`)
        }
        console.log('Send to Illustrator');
      } else if (this.$root.mods.Shift) {
        console.log('Add to selection');
      }
    },
    prefixClass(swatch) {
      var str = 'swatchPrefix-'
      str += 'Def'
      // if (this.$root.isDefault) {
      //   str += 'Def'
      // } else if ((this.$root.mods.Ctrl) && (!this.$root.mods.Shift) && (!this.$root.mods.Alt)) {
      //   str += 'Select'
      // } else if ((this.$root.mods.Shift) && (!this.$root.mods.Ctrl) && (!this.$root.mods.Alt)) {
      //   str += 'Add'
      // } else if ((this.$root.mods.Alt) && (!this.$root.mods.Shift) && (!this.$root.mods.Ctrl)) {
      //   str += 'Minus'
      // } else {
      //   str += 'Multi'
      // }
      return str;
    },
    prefixStyle(swatch) {
      var str = ''
      if ((!this.$root.isDefault) && (swatch.isHover)) {
        str = 'width: 40%;';
      } else {
        str = 'width: 0%';
      }
      return str;
    },
    suffixStyle(swatch) {
      var str = ''
      if ((!this.isDefault) && (swatch.isHover)) {
        str = 'width: 60%;';
      } else {
        str = 'width: 100%';
      }
      return str;
    },
    getSwatchClass(swatch) {
      var str = 'swatch-'
      if (swatch.isActive)
        str += 'active'
      else
        str += 'idle'
      return str;
    },
    getSwatchStyle(swatch) {
      var bg = 'background-color:' + swatch.value
      var wCond = '', cCond = '';
      // if ((swatch.isActive) && (this.hasHandle(swatch)) && (this.isDefault)) {
      //   wCond = '1.35px 1.35px 1.35px 0px'
      //   cCond = this.$root.getCSS('color-ui-selected');
      // } else if ((swatch.isActive) && (this.isDefault)) {
      //   wCond = '1.35px'
      //   cCond = this.$root.getCSS('color-ui-selected');
      // } else if ((!this.isDefault) && (swatch.isHover)) {
      //   wCond = '1.35px 1.35px 1.35px 0px'
      //   // cCond = this.$root.getCSS('color-ui-hover');
      //   cCond = 'transparent'
      // } else {
      //   wCond = '1.35px'
      //   cCond = 'transparent'
      // }
      if (swatch.isActive)
        wCond = '1.35px', cCond = this.$root.getCSS('color-ui-selected');
      var border = `border-width:${wCond}`;
      var bcolor = `border-color:${cCond}`;

      var style = `${bg};${border};${bcolor};border-style: solid;`;
      console.log(style);
      return style;
    },
    showPrefix(swatch) {
      Event.$emit('swatchClearHoverEvt', swatch.key);
      swatch.isHover = true;
      swatch.showPrefix = true;
      // console.log(swatch);
    },
    hidePrefix(swatch) {
      swatch.showPrefix = false;
    }
  }
})



Vue.component('swatch-icon', {
  props: {
    model: Object,
  },
  template: `
    <div v-if="model.showPrefix" class="swatch-icon">
      <span :class="getIconFor(model)"></span>
    </div>
  `,
  data() {
    return {
      msg: 'o'
    }
  },
  methods: {
    getIconFor(swatch) {
      var str = 'swatch-icon-min protocolor-icon-'
      if (this.$root.isDefault) {
        str += 'Def'
      } else if ((this.$root.mods.Ctrl) && (!this.$root.mods.Shift) && (!this.$root.mods.Alt)) {
        str += 'cursor'
      } else if ((this.$root.mods.Shift) && (!this.$root.mods.Ctrl) && (!this.$root.mods.Alt)) {
        str += 'plus'
      } else if ((this.$root.mods.Alt) && (!this.$root.mods.Shift) && (!this.$root.mods.Ctrl)) {
        str += 'find'
      } else {
        str += 'Multi'
      }
      return str;
    }
  }
})

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

Vue.component('footer-main', {
  template: `
    <div class="footerMain bbox">
      <div class="footerInfo bbox"></div>
      <div class="testToolbar bbox">
        <div class="testToolbarBtn bbox"></div>
        <div class="testToolbarBtn bbox"></div>
      </div>
    </div>
  `,
})


var app = new Vue({
  el: '#app',
  data: {
    context: {
      menu: [
        {
          id: "refresh",
          label: "Refresh panel",
          enabled: true,
          checkable: false,
          checked: false,
        },
      ],
    },
    panelHeight: 100,
    panelWidth: 50,
    isFillActive: false,
    mods: {
      Shift: false,
      Ctrl: false,
      Alt: false,
    },
  },
  computed: {
    menuString: function() {return JSON.stringify(this.context);},
    isDefault: function() {
      var result = true;
      if ((this.mods.Shift) | (this.mods.Ctrl) | (this.mods.Alt))
        result = false;
      return result;
    },
  },
  mounted: function () {
    var self = this;
    csInterface.setContextMenuByJSON(self.menuString, self.contextMenuClicked);
    this.setContextMenu();
    this.handleResize(null);
    window.addEventListener('resize', this.handleResize);
    this.setCSSHeight();
    this.getAllAIColors();
    Event.$on('modsUpdate', self.parseModifiers);
    Event.$on('checkSelectedColors', self.getSelectedAIColors);
  },
  methods: {
    updateSelectedAIColors(msg) {
      console.log('Receiving');
      if (/\,/.test(msg))
        msg = JSON.parse(msg);
      // console.log(msg);
      Event.$emit('updateSelectedColors', msg)
    },
    getSelectedAIColors(msg) {
      var self = this;
      console.log('Requesting');
      csInterface.evalScript(`scanSelectedColors('${msg}')`, self.updateSelectedAIColors)
      // return ['#ff0000', '#00ffff', '#ff00ff'];
    },
    getAllAIColors() {
      var self = this;
      console.log('Requesting');
      csInterface.evalScript(`scanAllColors()`, self.readAllAIColors)
    },
    readAllAIColors(msg) {
      console.log('Receiving');
      if (/\,/.test(msg))
        msg = JSON.parse(msg);
      console.log(msg);
    },
    wake() {
      this.isWake = true;
    },
    sleep() {
      this.isWake = false;
      this.flushModifiers();
    },
    setCSSHeight() {
      this.setCSS('panel-height', this.panelHeight - 10 + 'px');
    },
    setContextMenu() {
      var self = this;
      csInterface.setContextMenuByJSON(self.menuString, self.contextMenuClicked);
    },
    handleResize(evt) {
      this.panelWidth = document.documentElement.clientWidth;
      this.panelHeight = document.documentElement.clientHeight;
      this.setCSSHeight();
    },
    flushModifiers() {
      this.mods.Ctrl = false;
      this.mods.Shift = false;
      this.mods.Alt = false;
      Event.$emit('clearMods');
    },
    parseModifiers(evt) {
      var lastMods = [this.mods.Ctrl, this.mods.Shift, this.mods.Alt]
      if (this.isWake) {
        if (evt.ctrlKey) {
          this.mods.Ctrl = true;
        } else {
          this.mods.Ctrl = false;
        }
        if (evt.shiftKey)
        this.mods.Shift = true;
        else
        this.mods.Shift = false;
        if (evt.altKey) {
          evt.preventDefault();
          this.mods.Alt = true;
        } else {
          this.mods.Alt = false;
        };
        var thisMods = [this.mods.Ctrl, this.mods.Shift, this.mods.Alt]
        if (!this.isEqualArray(lastMods, thisMods))
        Event.$emit('updateModsUI');
      } else {
        Event.$emit('clearMods');
      }
    },
    contextMenuClicked(id) {
      if (id == "refresh")
        location.reload();
    },
    isEqualArray(array1, array2) {
      array1 = array1.join().split(','), array2 = array2.join().split(',');
      var errors = 0, result;
      for (var i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i])
          errors++;
      }
      if (errors > 0)
        result = false;
      else
        result = true;
      return result;
    },
    removeDuplicatesInArray(keyList) {
      var uniq = keyList
      .map((name) => {
        return {count: 1, name: name}
      })
      .reduce((a, b) => {
        a[b.name] = (a[b.name] || 0) + b.count
        return a
      }, {})
      return sorted = Object.keys(uniq).sort((a, b) => uniq[a] < uniq[b])
    },
    getCSS(prop) {
      return window.getComputedStyle(document.documentElement).getPropertyValue('--' + prop);
    },
    setCSS(prop, data) {
      document.documentElement.style.setProperty('--' + prop, data);
    },
  }
});
