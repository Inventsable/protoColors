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
  // sort-by and scanner are hidden
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
        value: '#292929'
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
        this.$root.hasSelection = true;
        Event.$emit('checkSelectedColors', array)
      } else {
        this.$root.hasSelection = false;
        Event.$emit('recheckFillStroke')
        this.clearSelection();
      }
      // console.log(array);
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
        // console.log(msg);
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
    },
    startSelectionScan() {
      this.toggleFillStrokeScan(true);
    },
    startFillStrokeScan() {
      this.toggleFillStrokeScan(true);
    },
    // start
  },
  mounted() {
    var self = this;
    Event.$on('stopSelectionScan', self.stopSelectionScan);
    Event.$on('startSelectionScan', self.startSelectionScan);
    Event.$on('stopFillStrokeScan', self.stopFillStrokeScan);
    Event.$on('startFillStrokeScan', self.startFillStrokeScan);
    Event.$on('recheckFillStroke', self.fillstrokeCheck);
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
          <line v-if="(!master.fill.hasColor) && (!multiFill)" class="fillstroke-cancel" x1="11" y1="63" x2="63" y2="11"/>
          <rect class="fillstroke-fill-frame" x="11" y="11" width="52" height="52"/>
          <path v-if="multiFill" class="multiClass" d="M43,30.87a5.86,5.86,0,0,1-.5,2.47,6.85,6.85,0,0,1-1.3,1.92,13.2,13.2,0,0,1-1.82,1.52c-.69.47-1.42.93-2.2,1.37v3.19H34.65V37l2-1.15a10.06,10.06,0,0,0,1.74-1.26,6.27,6.27,0,0,0,1.28-1.52,4,4,0,0,0,.45-2A2.75,2.75,0,0,0,39,28.7a4.62,4.62,0,0,0-2.8-.79,8.63,8.63,0,0,0-2.89.48,10.91,10.91,0,0,0-2.16,1H31V26.48a16.72,16.72,0,0,1,2.51-.69,14.84,14.84,0,0,1,2.88-.3A7.24,7.24,0,0,1,41.24,27,4.86,4.86,0,0,1,43,30.87ZM37.41,47H34.52V44h2.89Z"/>
        </g>
        <g id="stroke">
          <rect class="fillstroke-mask" x="37" y="37" width="52" height="52"/>
          <rect class="fillstroke-stroke" :style="strokeStyle" x="37" y="37" width="52" height="52"/>
          <rect class="fillstroke-bg" x="50.91" y="50.91" width="24.18" height="24.18"/>
          <rect class="fillstroke-stroke-frame" x="50.91" y="50.91" width="24.18" height="24.18"/>
          <line v-if="(!master.stroke.hasColor) && (!multiStroke)" class="fillstroke-cancel" x1="37" y1="89" x2="89" y2="37"/>
          <rect class="fillstroke-stroke-frame" x="37" y="37" width="52" height="52"/>
          <g v-if="multiStroke">
            <path class="multiClass" d="M47.5,41.71A2.91,2.91,0,0,1,47.25,43a3.37,3.37,0,0,1-.65,1,6.52,6.52,0,0,1-.93.76c-.34.24-.71.47-1.1.7V47H43.29V44.81l1-.57a5.26,5.26,0,0,0,.89-.64,3.19,3.19,0,0,0,.64-.77,2,2,0,0,0,.23-1,1.39,1.39,0,0,0-.55-1.2,2.29,2.29,0,0,0-1.41-.4,4.43,4.43,0,0,0-1.46.24,6,6,0,0,0-1.09.5h-.07V39.5a8.22,8.22,0,0,1,1.27-.35A7.52,7.52,0,0,1,44.19,39a3.63,3.63,0,0,1,2.42.75A2.4,2.4,0,0,1,47.5,41.71Zm-2.82,8.14H43.23V48.34h1.45Z"/>
            <path class="multiClass" d="M84.33,41.71A2.91,2.91,0,0,1,84.08,43a3.21,3.21,0,0,1-.66,1,5.91,5.91,0,0,1-.92.76c-.34.24-.71.47-1.1.7V47H80.12V44.81l1-.57A4.78,4.78,0,0,0,82,43.6a3.25,3.25,0,0,0,.65-.77,2,2,0,0,0,.22-1,1.38,1.38,0,0,0-.54-1.2,2.33,2.33,0,0,0-1.41-.4,4.38,4.38,0,0,0-1.46.24,5.69,5.69,0,0,0-1.09.5H78.3V39.5a8.39,8.39,0,0,1,1.26-.35A7.7,7.7,0,0,1,81,39a3.63,3.63,0,0,1,2.42.75A2.4,2.4,0,0,1,84.33,41.71Zm-2.82,8.14H80.05V48.34h1.46Z"/>
            <path class="multiClass" d="M47.5,78.18a2.89,2.89,0,0,1-.25,1.24,3.24,3.24,0,0,1-.65,1,6.56,6.56,0,0,1-.93.77c-.34.23-.71.47-1.1.69v1.61H43.29V81.28l1-.58a4.76,4.76,0,0,0,.89-.64,3.16,3.16,0,0,0,.64-.76,2.07,2.07,0,0,0,.23-1,1.42,1.42,0,0,0-.55-1.21,2.35,2.35,0,0,0-1.41-.39,4.43,4.43,0,0,0-1.46.24,5.43,5.43,0,0,0-1.09.49h-.07V76a8.34,8.34,0,0,1,1.27-.34,7.56,7.56,0,0,1,1.45-.16,3.63,3.63,0,0,1,2.42.75A2.42,2.42,0,0,1,47.5,78.18Zm-2.82,8.13H43.23v-1.5h1.45Z"/>
            <path class="multiClass" d="M84.33,78.18a2.89,2.89,0,0,1-.25,1.24,3.09,3.09,0,0,1-.66,1,6,6,0,0,1-.92.77c-.34.23-.71.47-1.1.69v1.61H80.12V81.28l1-.58a4.36,4.36,0,0,0,.88-.64,3.21,3.21,0,0,0,.65-.76,2.07,2.07,0,0,0,.22-1,1.41,1.41,0,0,0-.54-1.21,2.4,2.4,0,0,0-1.41-.39,4.38,4.38,0,0,0-1.46.24,5.18,5.18,0,0,0-1.09.49H78.3V76a8.51,8.51,0,0,1,1.26-.34A7.75,7.75,0,0,1,81,75.46a3.63,3.63,0,0,1,2.42.75A2.42,2.42,0,0,1,84.33,78.18Zm-2.82,8.13H80.05v-1.5h1.46Z"/>
          </g>
        </g>
        <g id="fill" v-if="isFillActive">
          <rect class="fillstroke-mask" x="11" y="11" width="52" height="52"/>
          <rect class="fillstroke-fill" :style="fillStyle" x="11" y="11" width="52" height="52"/>
          <line v-if="(!master.fill.hasColor) && (!multiFill)" class="fillstroke-cancel" x1="11" y1="63" x2="63" y2="11"/>
          <rect class="fillstroke-fill-frame" x="11" y="11" width="52" height="52"/>
          <path v-if="multiFill" class="multiClass" d="M43,30.87a5.86,5.86,0,0,1-.5,2.47,6.85,6.85,0,0,1-1.3,1.92,13.2,13.2,0,0,1-1.82,1.52c-.69.47-1.42.93-2.2,1.37v3.19H34.65V37l2-1.15a10.06,10.06,0,0,0,1.74-1.26,6.27,6.27,0,0,0,1.28-1.52,4,4,0,0,0,.45-2A2.75,2.75,0,0,0,39,28.7a4.62,4.62,0,0,0-2.8-.79,8.63,8.63,0,0,0-2.89.48,10.91,10.91,0,0,0-2.16,1H31V26.48a16.72,16.72,0,0,1,2.51-.69,14.84,14.84,0,0,1,2.88-.3A7.24,7.24,0,0,1,41.24,27,4.86,4.86,0,0,1,43,30.87ZM37.41,47H34.52V44h2.89Z"/>
        </g>
      </svg>
    </div>
  `,
  data() {
    return {
      multiFill: false,
      multiStroke: false,
      master: {
        fill: {
          active: true,
          color: 'white',
        },
        stroke: {
          active: false,
          color: 'white',
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
    setMultiFill(state) {
      // console.log(`setting multi fill to ${state}`);
      this.multiFill = state;
      if (this.multiFill)
        this.setFillStroke(this.master);
    },
    setMultiStroke(state) {
      // console.log(`setting multi stroke to ${state}`);
      this.multiStroke = state;
      if (this.multiStroke)
        this.setFillStroke(this.master);
    },
    clearMultis: function() {
      this.multiFill = false, this.multiStroke = false;
      this.setFillStroke(this.master)
    },
    setFillStroke(msg) {
      this.master = msg;
      if (!this.multiStroke)
        this.$root.setCSS('color-def-stroke', msg.stroke.color);
      else
        this.$root.setCSS('color-def-stroke', this.$root.getCSS('color-bg'));
      if (!this.multiFill)
        this.$root.setCSS('color-def-fill', msg.fill.color);
      else
        this.$root.setCSS('color-def-fill', this.$root.getCSS('color-bg'));
      this.$root.checkForNewColors(msg);
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
    },
  },
  mounted() {
    var self = this;
    Event.$on('updateFillStroke', self.setFillStroke);
    Event.$on('updateFS_MultiFill', self.setMultiFill);
    Event.$on('updateFS_MultiStroke', self.setMultiStroke);
    Event.$on('recheckFillStroke', self.clearMultis);
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
      total: 0,
      swatchList: {
        raw: [],
        cloned: [],
        byTime: [
          {
            key: 0,
            value: '#eb6d5a',
            showPrefix: false,
            isActive: true,
            isHover: false,
            isFind: false,
            isReplace: false,
          },
          {
            key: 1,
            value: '#66ff3b',
            showPrefix: false,
            isActive: false,
            isHover: false,
            isFind: false,
            isReplace: false,
          },
          {
            key: 2,
            value: '#3593eb',
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
    Event.$on('constructSwatches', self.readAllSwatches);
    Event.$on('swatchClearHoverEvt', self.clearSwatchesHover);
    Event.$on('addNewSwatch', self.addNewSwatch);
    Event.$on('clearSwatchesActive', self.clearSwatchesActive)
  },
  methods: {
    readAllSwatches(msg) {
      var uniques = this.getUniqueColors(msg);
      console.log(uniques);
    },
    getUniqueColors(array) {
      var allColors = [];
      for (var i = 0; i < array.length; i++) {
        if (array[i].fill !== 'none')
          allColors.push(array[i].fill)
        if (array[i].stroke !== 'none')
          allColors.push(array[i].stroke)
      }
      var results = this.$root.removeDuplicatesInArray(allColors);
      this.constructSwatches(results);
      return results;
    },
    addNewSwatch(color) {
      var self = this;
      var clone = {
        key: 0,
        value: color,
        showPrefix: false,
        isActive: false,
        isHover: false,
        isFind: false,
        isReplace: false,
      }
      this.swatchList.byTime.unshift(clone);
    },
    constructSwatches(array) {
      var clone, mirror = [];
      for (var i = 0; i < array.length; i++) {
        clone = {
          key: i,
          value: array[i],
          showPrefix: false,
          isActive: false,
          isHover: false,
          isFind: false,
          isReplace: false,
        }
        mirror.push(clone);
      }
      this.swatchList.byTime = mirror;
      this.total = mirror.length;
      this.$root.masterColors = array;
    },
    setSwatchLength() {
      this.$root.setCSS('swatchLength', this.swatchList.byTime.length);
    },
    swatchRangeOut(evt) {
      try {
        if (evt.toElement.className !== 'swatch')
        this.clearSwatchesHover();
      } catch(e) {return}
    },
    clearSwatchesActive(except) {
      var which = this.sorted
      var target = this.swatchList[which];
      for (var i = 0; i < target.length; i++) {
        if (i !== except)
          target[i].isActive = false;
      }
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
          <div class="swatchMain">
            <div :class="prefixClass(swatch)" :style="prefixStyle(swatch)">
              <swatch-icon v-if="!isDefault" :model="swatch"></swatch-icon>
            </div>
            <div class="swatchSuffix" :style="suffixStyle(swatch)"></div>
          </div>
          <div class="blank"></div>
          <div :class="tagClass(swatch)">
            <swatch-tag v-if="swatch.isActive" :model="swatch"></swatch-tag>
          </div>
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
          csInterface.evalScript(`setDefaultFill('${swatch.value}')`)
        } else {
          csInterface.evalScript(`setDefaultStroke('${swatch.value}')`)
        }
        if (this.$root.hasSelection)
          console.log('Send to Illustrator');
      } else if (this.$root.mods.Shift) {
        // swatch.isActive = !swatch.isActive;
        console.log('Add to selection');
      } else if (this.$root.mods.Ctrl) {
        Event.$emit('clearSwatchesActive', swatch.key);
        swatch.isActive = !swatch.isActive;
        // if (!this.$root.hasSelection)
        //   swatch.isActive = false;
        if (this.$root.isFillActive) {
          if (swatch.isActive)
            csInterface.evalScript(`selectSameFill('${swatch.value}')`)
          else
            csInterface.evalScript(`clearSelection()`);
        } else {
          if (swatch.isActive)
            csInterface.evalScript(`selectSameStroke('${swatch.value}')`)
          else
            csInterface.evalScript(`clearSelection()`);
        }
        console.log('Select all ');
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
        str = 'width: 50%;opacity:1;';
      } else {
        str = 'width: 0%;opacity:0;';
      }
      return str;
    },
    suffixStyle(swatch) {
      var str = ''
      if ((!this.isDefault) && (swatch.isHover)) {
        str = 'width: 50%;';
      } else {
        str = 'width: 100%';
      }
      return str;
    },
    tagClass(swatch) {
      var str = 'swatch-tag-'
      if (swatch.isActive)
        str += 'active'
      else
        str += 'idle'
      return str;
    },
    tagStyle(swatch) {
      var bg = 'background-color: #323232'
      // var wCond = '0px', cCond = 'transparent';
      // var border = `border-width:${wCond}`;
      // var bcolor = `border-color:${cCond}`;
      //
      // var style = `${bg};${border};${bcolor};border-style: solid;`;
      return bg;
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
      // if (swatch.isActive)
      //   wCond = '1.35px', cCond = this.$root.getCSS('color-ui-selected');
      // else
      //   wCond = '0px', cCond = 'transparent';
      // var border = `border-width:${wCond}`;
      // var bcolor = `border-color:${cCond}`;
      //
      // var style = `${bg};${border};${bcolor};border-style: solid;`;
      // console.log(style);
      return bg;
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

Vue.component('swatch-tag', {
  props: {
    model: Object,
  },
  template: `
    <div v-if="model.isActive" class="swatch-tag-icon"></div>
  `,
})


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
    scanning: {
      selection: true,
      fillstroke: true,
    },
    context: {
      menu: [
        {
          id: "refresh",
          label: "Refresh panel",
          enabled: true,
          checkable: false,
          checked: false,
        },
        {
          id: "allcolors",
          label: "Document colors",
          enabled: true,
          checkable: false,
          checked: false,
        },
        {
          label: "---"
        },
        {
          id: "scanner",
          label: "Scanning",
          menu: [
            {
              id: "scanselection",
              label: "Selection",
              enabled: true,
              checkable: true,
              checked: true,
            },
            {
              id: "scanfillstroke",
              label: "Fill/Stroke",
              enabled: true,
              checkable: true,
              checked: true,
            },
          ]
        },
        {
          id: "sortby",
          label: "Sort Colors By",
          menu: [
            {
              id: "sortbytime",
              label: "Time",
              enabled: true,
              checkable: true,
              checked: true,
            },
            {
              id: "sortbyspectrum",
              label: "Spectrum",
              enabled: true,
              checkable: true,
              checked: false,
            },
          ]
        },
      ],
    },
    panelHeight: 100,
    panelWidth: 50,
    isFillActive: false,
    hasSelection: false,
    currentFills: [],
    currentStrokes: [],
    defaultSort: true,
    masterColors: [],
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
    Event.$on('scanAllAIColors', self.getAllAIColors);
  },
  methods: {
    checkForNewColors(msg) {
      console.log('Newest');
      var stroke = msg.stroke.color, fill = msg.fill.color, local, err = 0, valid = true;
      if (msg.fill.active)
        local = fill;
      else
        local = stroke;
      if (/white/.test(local))
        valid = false;
        // local = '#ffffff'
      if (valid) {
        for (var i = 0; i < this.masterColors.length; i++) {
          if (local !== this.masterColors[i]) {
            console.log(`${local} !== ${this.masterColors[i]}`);
            err++;
          }
        }
        // console.log(`${local} : ${err} : ${this.masterColors.length}`);
        if (err == this.masterColors.length) {
          Event.$emit('addNewSwatch', local)
          this.masterColors.unshift(local);
        }
        if (!this.hasSelection)
          Event.$emit('clearSwatchesActive', -1);
      }
    },
    stripNoAppearanceFrom(array) {
      var mirror = [];
      for (var i = 0; i < array.length; i++) {
        if (!/none/.test(array[i]))
          mirror.push(array[i]);
      }
      return mirror;
    },
    checkForMultipleAppearances(msg) {
      var mirror = [], clone, result = false, fills = [], strokes = [];
      for (var i = 0; i < msg.length; i++) {
        for (let [key, value] of Object.entries(msg[i])) {
          if ((key == 'fill') && (!fills.includes(value)))
            fills.push(value);
          if ((key == 'stroke') && (!strokes.includes(value)))
            strokes.push(value);
        }
      }
      fills = this.stripNoAppearanceFrom(fills);
      strokes = this.stripNoAppearanceFrom(strokes);
      this.currentFills = fills;
      this.currentStrokes = strokes;
      if (fills.length > 1)
        Event.$emit('updateFS_MultiFill', true)
      else
        Event.$emit('updateFS_MultiFill', false)
      if (strokes.length > 1)
        Event.$emit('updateFS_MultiStroke', true)
      else
        Event.$emit('updateFS_MultiStroke', false)
      return msg;
    },
    updateSelectedAIColors(msg) {
      if (/\,/.test(msg))
        msg = JSON.parse(msg);
      this.checkForMultipleAppearances(msg);
      Event.$emit('updateSelectedColors', msg);
    },
    getSelectedAIColors(msg) {
      var self = this;
      csInterface.evalScript(`scanSelectedColors('${msg}')`, self.updateSelectedAIColors)
    },
    getAllAIColors() {
      var self = this;
      console.log('Requesting all colors');
      csInterface.evalScript(`scanAllColors()`, self.readAllAIColors)
    },
    readAllAIColors(msg) {
      console.log('Receiving all colors');
      if (/\,/.test(msg))
        msg = JSON.parse(msg);
      // console.log(msg);
      Event.$emit('constructSwatches', msg)
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
        // console.log(evt);
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
      if (id == "allcolors") {
        this.getAllAIColors();
      } else if (id == "refresh") {
        location.reload();
      }
      if (id == "scanselection") {
        if (this.scanning.selection)
          Event.$emit('stopSelectionScan');
        else
          Event.$emit('startSelectionScan');
        this.scanning.selection = !this.scanning.selection;
      }
      if (id == "scanfillstroke") {
        if (this.scanning.fillstroke)
          Event.$emit('stopFillStrokeScan');
        else
          Event.$emit('startFillStrokeScan');
        this.scanning.fillstroke = !this.scanning.fillstroke;
      }
      if (id == 'sortbyspectrum') {
        var toggle = false;
        if (this.defaultSort) {
          toggle = true;
          this.defaultSort = !toggle;
        }
        csInterface.updateContextMenuItem(id, true, toggle);
        csInterface.updateContextMenuItem('sortbytime', true, !toggle);
      }
      if (id == 'sortbytime') {
        var toggle = true;
        if (this.defaultSort) {
          toggle = false;
          this.defaultSort = !toggle;
        }
        csInterface.updateContextMenuItem(id, true, toggle);
        csInterface.updateContextMenuItem('sortbyspectrum', true, !toggle);
      }
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
