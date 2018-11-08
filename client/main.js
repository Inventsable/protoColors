var csInterface = new CSInterface();
loadUniversalJSXLibraries();
loadJSX(csInterface.hostEnvironment.appName + '/host.jsx');
window.Event = new Vue();

Vue.component('proto-colors', {
  template: `
    <div class="appGrid" @mouseover="wakeApp" @mouseout="sleepApp">
      <div :class="'mainTop-' + this.$root.activeApp">
        <head-main></head-main>
        <body-main></body-main>
      </div>
      <end v-if="showFoot"></end>
    </div>
  `,
  data() {
    return {
      showFoot: false,
    }
  },
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

Vue.component('end', {
  template: `
    <div class="end">
      <span>1.0</span>
    </div>
  `,
})

Vue.component('head-main', {
  // sort-by and scanner are hidden
  template: `
    <div class="headerMain">
      <scanner></scanner>
      <visualizers></visualizers>
    </div>
  `,
  // methods: {
  //   appHeadClass() {
  //     return `headerMain`;
  //   }
  // }
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
        value: 'transparent'
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
      console.log(array)
      var allColors = [];
      if (this.$root.activeApp == 'ILST') {
        for (var i = 0; i < array.length; i++) {
          if (array[i].fill !== 'none')
            allColors.push(array[i].fill)
          if (array[i].stroke !== 'none')
            allColors.push(array[i].stroke)
        }
      } else {
        allColors = array;
      }
      var results = this.$root.removeDuplicatesInArray(allColors);
      results = this.$root.removeEmptyValues(results);
      console.log(results)
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
        if (this.$root.activeApp == 'ILST'||'PHXS') {
          Event.$emit('recheckFillStroke')
        }
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
      if (this.$root.activeApp == 'ILST'||'AEFT')
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
      // console.log(`Selection is ${this.isScanning}`);
    },
    fillstrokeRead(msg) {
      var last = this.lastFillStroke;
      if (/\,/.test(msg))
        msg = JSON.parse(msg);
      // console.log(msg)
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
      if (this.$root.activeApp == 'ILST')
        csInterface.evalScript(`scanFillStroke()`, self.fillstrokeRead)
      else if (this.$root.activeApp == 'PHXS')
        csInterface.evalScript(`scanFGBG()`, self.fillstrokeRead)
      // else if (this.$root.activeApp == 'AEFT') {
      //   // console.log(`w${window.innerWidth} h${window.innerHeight}`)        
      // }
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
      // console.log(`Fillstroke is ${this.isScanning}`);
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
          <rect v-if="(this.$root.activeApp == 'ILST')" class="fillstroke-mask" x="37" y="37" width="52" height="52"/>
          <rect class="fillstroke-stroke" :style="strokeStyle" x="37" y="37" width="52" height="52"/>
          <rect v-if="(this.$root.activeApp == 'ILST')" class="fillstroke-bg" x="50.91" y="50.91" width="24.18" height="24.18"/>
          <rect v-if="(this.$root.activeApp == 'ILST')" class="fillstroke-stroke-frame" x="50.91" y="50.91" width="24.18" height="24.18"/>
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
    doubleCheckFillStroke() {
      var self = this;
      if (this.$root.activeApp == 'ILST')
        csInterface.evalScript(`scanFillStroke()`, self.$root.fillstrokeRead)
    }
  },
  mounted() {
    var self = this;
    this.doubleCheckFillStroke();
    Event.$on('updateFillStroke', self.setFillStroke);
    Event.$on('updateFS_MultiFill', self.setMultiFill);
    Event.$on('updateFS_MultiStroke', self.setMultiStroke);
    Event.$on('recheckFillStroke', self.clearMultis);
  }
})

Vue.component('visualizers', {
  template: `
    <div :class="'headerVisualizers-' + this.$root.activeApp">
      <mod-keys></mod-keys>
      <fill-stroke/>
      <selection-colors></selection-colors>
    </div>
  `,
})

Vue.component('mod-keys', {
  template: `
    <div 
      v-mousemove-outside="onMouseOutside"
      v-keydown-outside="onKeyDownOutside"
      v-keyup-outside="onKeyUpOutside"
      class="visualizerModKeys" 
      :style="'grid-template-columns: repeat(' + this.activeList.length + ', 1fr);'">
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
      this.$root.parseModifiers(e);
    },
    onKeyDownOutside(e, el) {
      // console.log(e)
      this.$root.parseModifiers(e);
    }, 
    onKeyUpOutside(e, el) {
      // console.log(e)
      this.$root.parseModifiers(e);
    },
  },
  computed: {
    isDefault: function() {return this.$root.isDefault},
  },
})

Vue.component('body-main', {
  //  @mouseover="restrictHandle" @mouseup="endDrag"
  template: `
    <div class="bodyMain">
      <div id="bodySwatchList" class="bodySwatches" @mouseout="swatchRangeOut">
        <swatch-list v-if="!sortByTime" :model="swatchList.bySpectrum"></swatch-list>
        <swatch-list v-if="sortByTime" :model="swatchList.byTime"></swatch-list>
        <div v-if="!swatchList.byTime.length" class="resetSwatchList" @click="resetColors">
          <span class="resetText">Reset</span>
        </div>
      </div>
    </div>
  `,
  // <handle :enabled="canHandle"></handle>
  data() {
    return {
      reverse: false,
      canHandle: false,
      sortByTime: true,
      sorted: 'byTime',
      total: 0,
      swatchList: {
        // raw: [],
        // cloned: [],
        bySpectrum: [
          {
            key: 0,
            value: '#ffffff',
            showPrefix: false,
            isActive: true,
            isHover: false,
            isFind: false,
            isReplace: false,
          },
          {
            key: 1,
            value: '#000000',
            showPrefix: false,
            isActive: false,
            isHover: false,
            isFind: false,
            isReplace: false,
          },
        ],
        byTime: [
          {
            key: 0,
            value: '#ffffff',
            showPrefix: false,
            isActive: true,
            isHover: false,
            isFind: false,
            isReplace: false,
          },
          {
            key: 1,
            value: '#000000',
            showPrefix: false,
            isActive: false,
            isHover: false,
            isFind: false,
            isReplace: false,
          },
        ],
      }
    }
  },
  mounted() {
    var self = this;
    // Event.$on('setReverse', this.setReverse);
    Event.$on('constructSwatches', self.readAllSwatches);
    Event.$on('constructSwatchesPS', self.readAllSwatchesPS);
    Event.$on('persistentLaunch', self.readAltList);
    Event.$on('swatchClearHoverEvt', self.clearSwatchesHover);
    Event.$on('addNewSwatch', self.addNewSwatch);
    Event.$on('clearSwatchesActive', self.clearSwatchesActive)
    Event.$on('toggleSortBySpectrum', self.toggleSortBySpectrum);
    Event.$on('setSortBySpectrum', self.setSortBySpectrum);
    Event.$on('setSortByTime', self.setSortByTime);
    Event.$on('reverseCurrentSwatches', self.toggleReverse);
    Event.$on('deleteSwatch', self.deleteSwatch);
    Event.$on('recheckReverse', self.checkReverse);
    Event.$on('resetColors', self.resetColors);
    this.reverse = this.$root.reversed;
  },
  methods: {
    // Persistent reverse does not work
    checkReverse() {
      if (this.$root.reversed)
      console.log(`${this.reverse} : ${this.$root.reversed}`)
      if (this.$root.reversed !== this.reverse)
        this.toggleReverse();
    },
    resetColors() {
      if (this.$root.activeApp == 'ILST') { 
        Event.$emit('scanAllAIColors');
      } else {
        // includes AE for some reason
        Event.$emit('scanAllPSColors');
      }
    },
    toggleReverse() {
      this.reverse = this.$root.reversed;
      this.clearSwatchesStatus();
      this.swatchList.byTime = this.swatchList.byTime.reverse();
      this.swatchList.bySpectrum = this.swatchList.bySpectrum.reverse();
      // this.$root.reverse = this.reverse;
      Event.$emit('updateReverse', this.reverse);
    },
    setSortByTime(state) {
      if (state) {
        this.sortByTime = true;
      }
    },
    setSortBySpectrum(state) {
      if (state) {
        this.sortByTime = false;
      }
    },
    toggleSortBySpectrum() {
      this.sortByTime = !this.sortByTime;
    },
    readAllSwatches(msg) {
      var uniques = this.getUniqueColors(msg);
      console.log(uniques);
      this.constructSwatches(uniques);
    },
    readAllSwatchesPS(msg) {
      // var uniques = this.getUniqueColors(msg);
      // console.log(uniques);
      this.constructSwatches(msg);
    },
    readAltList(array) {
      this.constructSwatches(array);
    },
    getUniqueColors(array) {
      // only for AI and AE
      var allColors = [];
      if (this.$root.activeApp == 'ILST') {
        for (var i = 0; i < array.length; i++) {
          if (array[i].fill !== 'none')
            allColors.push(array[i].fill)
          if (array[i].stroke !== 'none')
            allColors.push(array[i].stroke)
        }
      } else {
        allColors = array;
      }
      var results = this.$root.removeDuplicatesInArray(allColors);
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
      if (!this.reverse)
        this.swatchList.byTime.unshift(clone);
      else
        this.swatchList.byTime.push(clone);
      // this.resetSwatchKeys();
      var spectrum = this.sortInSpectrum(true);
      this.swatchList.bySpectrum = this.constructSpectrumSwatches(spectrum);
      Event.$emit('updateSessionColors');
    },
    deleteSwatch(value) {
      var self = this;
      for (var i = 0; i < this.$root.masterColors.length; i++) {
        if (this.$root.masterColors[i] == value)
          this.$root.masterColors.splice(i,1);
      }
      this.constructSwatches(this.$root.masterColors);
    },
    resetSwatchKeys() {
      // if (!this.$root.reversed) {
      //   for (var i = 0; i < this.swatchList.byTime.length; i++) {
      //     var swatch = this.swatchList.byTime[i];
      //     swatch.key = i;
      //     var specswatch = this.swatchList.bySpectrum[i];
      //     specswatch.key = i;
      //   }
      // } else {
      //   for (var i = this.swatchList.byTime.length; i > 0; i--) {
      //     var swatch = this.swatchList.byTime[i];
      //     swatch.key = i;
      //     var specswatch = this.swatchList.bySpectrum[i];
      //     specswatch.key = i;
      //   }
      // }
    },
    constructSwatches(array) {
      // console.log(array)
      var clone, mirror = [];
      if (array.length > 0) {
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
      } else {
        var white = {
          key: 0,
          value: '#ffffff',
          showPrefix: false,
          isActive: false,
          isHover: false,
          isFind: false,
          isReplace: false,
        }
        var black = {
          key: 1,
          value: '#000000',
          showPrefix: false,
          isActive: false,
          isHover: false,
          isFind: false,
          isReplace: false,
        }
        // mirror = [white, black];
        // array = ['#ffffff', '#000000']
      }
      // this.reverse = this.$root.reversed;
      // console.log(this.reverse)

      // @@ ERROR - Refreshing when Storage:Reversed causes never-ending toggling of Reverse
      // if (!this.$root.reversed) {
        this.swatchList.byTime = mirror;
        this.$root.masterColors = array;
        var spectrum = this.sortInSpectrum(true);
        this.swatchList.bySpectrum = this.constructSpectrumSwatches(spectrum);
      // } else {
      //   this.swatchList.byTime = mirror;
      //   this.$root.masterColors = array.reverse();
      //   var spectrum = this.sortInSpectrum(true);
      //   this.swatchList.bySpectrum = this.constructSpectrumSwatches(spectrum.reverse());
      // }
      Event.$emit('updateSessionColors');
      this.total = mirror.length;
      Event.$emit('recheckReverse');
    },
    constructSpectrumSwatches(array) {
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
      return mirror;
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
    clearSwatchesStatus() {
      var which = this.sorted;
      var target = this.swatchList[which];
      for (var i = 0; i < target.length; i++) {
        // if (i !== except)
          target[i].isActive = false;
          target[i].isHover = false;
          target[i].showPrefix = false;
      }
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
      // var which = this.sorted
      var time = this.swatchList.byTime;
      var spec = this.swatchList.bySpectrum;
      for (var i = 0; i < time.length; i++) {
        time[i].isHover = false;
        time[i].showPrefix = false;
        spec[i].isHover = false;
        spec[i].showPrefix = false;
      }
    },
    sortInSpectrum(forward=true) {
      // This is stacking errors on jaistlyn's file
      var self = this;
      // console.log("Sorting: " + colorHistory);
      var n = [];
      for (var index = 0; index < this.$root.masterColors.length; index++){
        var c = [];
        c.push(hexToRgb(this.$root.masterColors[index]).r);
        c.push(hexToRgb(this.$root.masterColors[index]).g);
        c.push(hexToRgb(this.$root.masterColors[index]).b);
        n.push(rgbToHsl(c));
      }
      n.sort(function(a, b){
        return a[0] - b[0];
      });
      var sorted = [];
      for (var index = 0; index < n.length; index++) {
        if (forward) {
          sorted.push(hslToHex(n[index][0], n[index][1], n[index][2]));
        } else {
          sorted.unshift(hslToHex(n[index][0], n[index][1], n[index][2]));
        }
      }
      // console.log("Sorted: " + sorted);
      return sorted;
    }
    // endDrag() {
    //   Event.$emit('endDragEvt')
    // },
    // restrictHandle(evt) {
    //   if ((evt.clientY > 96) && (evt.clientY < 340))
    //     this.canDrag = true;
    //   else
    //     this.canDrag = false;
    //   if (!this.canDrag) {
    //     this.endDrag();
    //     // console.log('Exiting');
    //   }
    // },
  }
})

Vue.component('swatch-list', {
  props: {
    model: Array,
  },
  data() {
    return {
      hasActive: false,
    }
  },
  computed: {
    isDefault: function() { 
      return this.$root.isDefault 
    },
    isIllustrator: function() {
      return (this.$root.activeApp == 'ILST') ? true : false;
    },
  },
  template: `
    <div class="swatchList bbox">
      <div v-for="swatch in model"
        @mouseover="showPrefix(swatch)"
        @mouseout="hidePrefix(swatch)"
        @click="currentAction(swatch)"
        :class="getSwatchClass(swatch)"
        :style="getSwatchStyle(swatch)">
          <div :class="wideStyle">
            <div :class="prefixClass(swatch)" :style="prefixStyle(swatch)">
              <swatch-icon v-if="!isDefault" :model="swatch"></swatch-icon>
            </div>
            <div v-if="hasActive" class="swatchSuffix" :style="suffixStyle(swatch)"></div>
          </div>
          <div class="blank"></div>
          <div :class="tagClass(swatch)">
            <swatch-tag v-if="swatch.isActive" :model="swatch"></swatch-tag>
          </div>
      </div>
    </div>
  `,
  methods: {
    wideStyle() {
      var style = 'swatchMain-' + this.$root.activeApp;
      return style;
    },
    hasHandle(swatch, result=false) {
      for (let [key,value] of Object.entries(swatch))
        if (swatch[key])
          result = true;
      return result;
    },
    currentAction(swatch) {
      // This is too broad, needs specific modkey combinations instead of standalone inclusion
      if (this.$root.isDefault) {
        if (this.$root.activeApp == 'ILST') {
          if (this.$root.isFillActive) {
            csInterface.evalScript(`setDefaultFill('${swatch.value}')`)
          } else {
            csInterface.evalScript(`setDefaultStroke('${swatch.value}')`)
          }
        } else if (this.$root.activeApp == 'PHXS') {
          var str = swatch.value;
          var trim = str.substring(1, 7)
          console.log(`Send ${swatch.value} as ${this.$root.activeApp} fg : ${trim}`);
          csInterface.evalScript(`setFG('${trim}')`);
        } else if (this.$root.activeApp == 'AEFT') {
          console.log(`What should be the default action for After Effects?`)
          if (this.$root.hasSelection) {
            console.log(`Assign ${swatch.value} to current selection if it has color properties`)
          }
        }
        // if (this.$root.hasSelection)
          // console.log('Send to Illustrator');
      } else if (this.$root.mods.Shift) {
        if (this.$root.activeApp == 'ILST') {
          console.log('Add to selection');
          if (this.$root.isFillActive) {
            if (swatch.isActive)
              csInterface.evalScript(`addSameFill('${swatch.value}')`)
            else
              csInterface.evalScript(`clearSelection()`);
          } else {
            if (swatch.isActive)
              csInterface.evalScript(`addSameStroke('${swatch.value}')`)
            else
              csInterface.evalScript(`clearSelection()`);
          }
        } else if (this.$root.activeApp == 'AEFT') {
          csInterface.evalScript(`startColorSelection('${swatch.value}', true)`);
          Event.$emit('checkSelectedColors')
        }
      } else if (this.$root.mods.Ctrl) {
        if (this.$root.activeApp == 'ILST') {
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
        } else if (this.$root.activeApp == 'PHXS'){
          Event.$emit('deleteSwatch', swatch.value)
        } else if (this.$root.activeApp == 'AEFT') {
          var self = this;
          console.log(`Select all props with color values matching ${swatch.value}`)
          csInterface.evalScript(`startColorSelection('${swatch.value}')`);
          Event.$emit('checkSelectedColors')
          // 
        }
      } else if (this.$root.mods.Alt) {
        if (this.$root.activeApp == 'ILST') {
          Event.$emit('deleteSwatch', swatch.value);
        } else if (this.$root.activeApp == 'PHXS') {
          var str = swatch.value;
          var trim = str.substring(1, 7)
          console.log(`Send ${swatch.value} as ${this.$root.activeApp} fg : ${trim}`)
          csInterface.evalScript(`setBG('${trim}')`)
        } else if (this.$root.activeApp == 'AEFT') {
          Event.$emit('deleteSwatch', swatch.value);
        }
      }
    },
    updateAESelection() {
      // console.log('Check for in selection');
      // Event.$emit('checkSelectedColors');
    },
    prefixClass(swatch) {
      var str = 'swatchPrefix-'
      str += 'Def'
      return str;
    },
    prefixStyle(swatch) {
      var str = ''
      if ((swatch.isHover) && (this.$root.activeApp == 'ILST')) {
        if ((this.$root.CtrlOnly) || (this.$root.ShiftOnly) || (this.$root.AltOnly))
          str = 'width: 50%;opacity:1;';
        else
          str = 'width: 0%;opacity:0;';
      } else if ((swatch.isHover) && (this.$root.activeApp == 'PHXS')) {
        if (this.$root.AltOnly)
          str = 'width: 50%;opacity:1;';
        else
          str = 'width: 0%;opacity:0;';
      } else if ((swatch.isHover) && (this.$root.activeApp == 'AEFT')) {
        if ((this.$root.CtrlOnly) || (this.$root.ShiftOnly))
          str = 'width: 50%;opacity:1;';
        else
          str = 'width: 0%;opacity:0;';
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
    // tagStyle(swatch) {
    //   var bg = 'background-color: #323232'
    //   // var wCond = '0px', cCond = 'transparent';
    //   // var border = `border-width:${wCond}`;
    //   // var bcolor = `border-color:${cCond}`;
    //   //
    //   // var style = `${bg};${border};${bcolor};border-style: solid;`;
    //   return bg;
    // },
    getSwatchClass(swatch) {
      var str = 'swatch-'
      if (swatch.isActive)
        str += 'active'
      else
        str += 'idle-' + this.$root.activeApp
      return str;
    },
    getSwatchStyle(swatch) {
      // if (swatch.value !== '#323232')
        return 'background-color:' + swatch.value;
      // else
        // return 'background-color:' + swatch.value + ';border: 1.35px solid ' + this.$root.getCSS('color-ui-idle');
    },
    showPrefix(swatch) {
      Event.$emit('swatchClearHoverEvt', swatch.key);
      swatch.isHover = true;
      // if ((this.onlyCtrl) || (this.onlyShift) || (this.onlyAlt))
        swatch.showPrefix = true;
      // else
      //   swatch.showPrefix = false;

      // if (this.$root.isDefault) {
      //   str += 'Def'
      // } else if ((this.$root.mods.Ctrl) && (!this.$root.mods.Shift) && (!this.$root.mods.Alt)) {
      //   str += 'cursor'
      // } else if ((this.$root.mods.Shift) && (!this.$root.mods.Ctrl) && (!this.$root.mods.Alt)) {
      //   str += 'plus'
      // } else if ((this.$root.mods.Alt) && (!this.$root.mods.Shift) && (!this.$root.mods.Ctrl)) {
      //   str += 'cancel'
      // } else if ((this.$root.mods.Alt) && (!this.$root.mods.Shift) && (this.$root.mods.Ctrl)) {
      //   str += 'cancel'
      // } else {
      //   str += 'Multi'
      // }
    },
    hidePrefix(swatch) {
      swatch.isHover = false;
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
      if (this.$root.activeApp == 'ILST') {
        if (this.$root.isDefault) {
          str += 'Def'
        } else if ((this.$root.mods.Ctrl) && (!this.$root.mods.Shift) && (!this.$root.mods.Alt)) {
          str += 'cursor'
        } else if ((this.$root.mods.Shift) && (!this.$root.mods.Ctrl) && (!this.$root.mods.Alt)) {
          str += 'plus'
        } else if ((this.$root.mods.Alt) && (!this.$root.mods.Shift) && (!this.$root.mods.Ctrl)) {
          str += 'cancel'
        } else if ((this.$root.mods.Alt) && (!this.$root.mods.Shift) && (this.$root.mods.Ctrl)) {
          str += 'cancel'
        } else {
          str += 'Multi'
        }
      } else if (this.$root.activeApp == 'PHXS') {
        if (this.$root.isDefault) {
          str += 'Def'
        } else if ((this.$root.mods.Ctrl) && (!this.$root.mods.Shift) && (!this.$root.mods.Alt)) {
          str += 'cancel'
        } else if ((this.$root.mods.Shift) && (!this.$root.mods.Ctrl) && (!this.$root.mods.Alt)) {
          str += 'plus'
        } else if ((this.$root.mods.Alt) && (!this.$root.mods.Shift) && (!this.$root.mods.Ctrl)) {
          str += 'dropper'
        }
        //  else if ((this.$root.mods.Alt) && (!this.$root.mods.Shift) && (this.$root.mods.Ctrl)) {
        //   str += 'cancel'
        // } else {
        //   str += 'Multi'
        // }
      } else if (this.$root.activeApp == 'AEFT') {
        if (this.$root.isDefault) {
          str += 'Def'
        } else if ((this.$root.mods.Ctrl) && (!this.$root.mods.Shift) && (!this.$root.mods.Alt)) {
          str += 'cursor'
        } else if ((this.$root.mods.Shift) && (!this.$root.mods.Ctrl) && (!this.$root.mods.Alt)) {
          str += 'plus'
        } else if ((this.$root.mods.Alt) && (!this.$root.mods.Shift) && (!this.$root.mods.Ctrl)) {
          str += 'cancel'
        }
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


// Vue.component('footer-main', {
//   template: `
//     <div class="footerMain bbox">
//       <div class="footerInfo bbox"></div>
//       <div class="testToolbar bbox">
//         <div class="testToolbarBtn bbox"></div>
//         <div class="testToolbarBtn bbox"></div>
//       </div>
//     </div>
//   `,
// })


var app = new Vue({
  el: '#app',
  data: {
    activeApp: csInterface.hostEnvironment.appName,
    activeTheme: 'darkest',
    reversed: false,
    themes: {
      lightest: '#f0f0f0',
      light: '#b8b8b8',
      dark: '#535353',
      darkest: '#323232',
    },
    macOS: false,
    persistent: false,
    scanning: {
      selection: true,
      fillstroke: true,
    },
    context: {
      menu: [
        { id: "reverse", path: "menu[0]", label: "Reverse order", enabled: true, checkable: false, checked: false, },
        { id: "refresh", path: "menu[1]", label: "Refresh panel", enabled: true, checkable: false, checked: false, },
        { id: "allcolors", path: "menu[2]", label: "Reset colors", enabled: true, checkable: false, checked: false, },
        { id: "persistent", path: "menu[3]", label: "Persistent Y/N", enabled: true, checkable: true, checked: false, ingroup: false },
        { label: "---" },
        { id: "opt", label: "Sort by:", enabled: false, checkable: false, checked: false, ingroup: false},
        { id: "sortbytime", label: "Time", enabled: true, checkable: true, checked: true, ingroup: false},
        { id: "sortbyspectrum", label: "Spectrum", enabled: true, checkable: true, checked: false, ingroup: false},
        { label: "---" },
        {
          id: "swatchsize", label: "Swatch size", menu: [
            { id: "large", label: "Large", enabled: true, checkable: true, checked: true, ingroup: true},
            { id: "small", label: "Small", enabled: true, checkable: true, checked: false, ingroup: true}, ]
        },
        {
          id: "scanner", label: "Scanner", menu: [
            { id: "scandoc", label: "Document colors", enabled: true, checkable: true, checked: true, ingroup: false},
            { id: "scanselection", label: "Selection", enabled: true, checkable: true, checked: true, ingroup: false},
            { id: "scanfillstroke", label: "Fill/Stroke", enabled: true, checkable: true, checked: true, ingroup: false},
            { id: "scanmods", label: "Modifier keys", enabled: true, checkable: true, checked: true, ingroup: false}, ]
        }
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
    CtrlShift: function() {
      if ((this.mods.Ctrl) && (this.mods.Shift)) {
        return true;
      } else {
        return false;
      }
    },
    CtrlAlt: function() {
      if ((this.mods.Ctrl) && (this.mods.Alt)) {
        return true;
      } else {
        return false;
      }
    },
    ShiftAlt: function() {
      if ((this.mods.Shift) && (this.mods.Alt)) {
        return true;
      } else {
        return false;
      }
    },
    CtrlShiftAlt: function() {
      if ((this.mods.Ctrl) && (this.mods.Shift) && (this.mods.Alt)) {
        return true;
      } else {
        return false;
      }
    },
    CtrlOnly: function() {
      if ((this.mods.Ctrl) && (!this.mods.Shift) && (!this.mods.Alt))
        return true;
      else
        return false;
    },
    ShiftOnly: function() {
      if ((!this.mods.Ctrl) && (this.mods.Shift) && (!this.mods.Alt))
        return true;
      else
        return false;
    },
    AltOnly: function() {
      if ((!this.mods.Ctrl) && (!this.mods.Shift) && (this.mods.Alt))
        return true;
      else
        return false;
    },
  },
  mounted() {
    var self = this;
    if (navigator.platform.indexOf('Win') > -1) { this.macOS = false; } else if (navigator.platform.indexOf('Mac') > -1) { this.macOS = true; }
    this.readStorage();
    this.setContextMenu();
    this.handleResize(null);
    window.addEventListener('resize', this.handleResize);
    this.setCSSHeight();
    if ((!this.persistent) && (this.activeApp == 'ILST'))
      this.getAllAIColors();
    else if ((!this.persistent) && (this.activeApp == 'AEFT'))
      this.getAllAEColors();
    else
      Event.$emit('persistentLaunch', self.masterColors)
    Event.$on('modsUpdate', self.parseModifiers);
    Event.$on('checkSelectedColors', self.getSelectedColors);
    Event.$on('scanAllAIColors', self.getAllAIColors);
    Event.$on('scanAllPSColors', self.getAllPSColors);
    Event.$on('updateSessionColors', self.updateSessionColors);
    Event.$on('updateStorage', self.updateStorage);
    Event.$on('updateReverse', self.setReverse);
    csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, self.appThemeChanged);
    this.appThemeChanged();
    // console.log('last?')
  },
  methods: {
    setReverse(state) {
      // This is redundant
      // this.reversed = state;
      this.updateStorage();
    },
    appThemeChanged(event) {
      var skinInfo = JSON.parse(window.__adobe_cep__.getHostEnvironment()).appSkinInfo;
      this.findTheme(skinInfo);
      console.log(`Theme changed to ${this.activeTheme}`);
      this.updateStorage();
    },
    findTheme(appSkin) {
      // AE uses smooth gradients. Isolate the others apps from it
      if ((this.$root.activeApp == 'ILST') || (this.$root.activeApp == 'PHXS')) {
        if (toHex(appSkin.panelBackgroundColor.color) == '#f0f0f0') {
          this.activeTheme = 'lightest';
          if (this.$root.activeApp == 'ILST') {
            this.setCSS('color-scroll', '#fbfbfb');
            this.setCSS('color-scroll-thumb', '#dcdcdc');
            this.setCSS('color-scroll-thumb-hover', '#a6a6a6');
          } else if (this.$root.activeApp == 'PHXS') {
            this.setCSS('color-scroll', '#e3e3e3');
            this.setCSS('color-scroll-thumb', '#bdbdbd');
            this.setCSS('color-scroll-thumb-hover', '#bdbdbd');
          }
        } else if (toHex(appSkin.panelBackgroundColor.color) == '#b8b8b8') {
          this.activeTheme = 'light';
          if (this.$root.activeApp == 'ILST') {
            this.setCSS('color-scroll', '#c4c4c4');
            this.setCSS('color-scroll-thumb', '#a8a8a8');
            this.setCSS('color-scroll-thumb-hover', '#7b7b7b');
          } else if (this.$root.activeApp == 'PHXS') {
            this.setCSS('color-scroll', '#ababab');
            this.setCSS('color-scroll-thumb', '#858585');
            this.setCSS('color-scroll-thumb-hover', '#858585');
          }
        } else if (toHex(appSkin.panelBackgroundColor.color) == '#535353') {
          this.activeTheme = 'dark';
          if (this.$root.activeApp == 'ILST') {
            this.setCSS('color-scroll', '#4b4b4b');
            this.setCSS('color-scroll-thumb', '#606060');
            this.setCSS('color-scroll-thumb-hover', '#747474');
          } else if (this.$root.activeApp == 'PHXS') {
            this.setCSS('color-scroll', '#4a4a4a');
            this.setCSS('color-scroll-thumb', '#696969');
            this.setCSS('color-scroll-thumb-hover', '#696969');
          }
        } else if (toHex(appSkin.panelBackgroundColor.color) == '#323232') {
          this.activeTheme = 'darkest';
          if (this.$root.activeApp == 'ILST') {
            this.setCSS('color-scroll', '#2a2a2a');
            this.setCSS('color-scroll-thumb', '#383838');
            this.setCSS('color-scroll-thumb-hover', '#525252');
          } else if (this.$root.activeApp == 'PHXS') {
            this.setCSS('color-scroll', '#292929');
            this.setCSS('color-scroll-thumb', '#474747');
            this.setCSS('color-scroll-thumb-hover', '#474747');
          }
        }
        this.setCSS('color-bg', toHex(appSkin.panelBackgroundColor.color));
        this.setCSS('color-ui-hover', this.$root.getCSS('color-scroll'));
        if (this.$root.activeApp == 'ILST') {
          this.setCSS('scroll-radius', '20px');
          this.setCSS('thumb-radius', '10px');
        } else {
          this.setCSS('scroll-radius', '1px');
          this.setCSS('thumb-width', '8px');
        }
      } else {
        console.log('This is an After Effects theme');
        this.activeTheme = 'afterFX';
        this.setCSS('color-bg', toHex(appSkin.panelBackgroundColor.color));
        this.setCSS('color-ui-hover', toHex(appSkin.panelBackgroundColor.color, -10));
        this.setCSS('color-scroll', toHex(appSkin.panelBackgroundColor.color, -20));
        this.setCSS('color-scroll-thumb', toHex(appSkin.panelBackgroundColor.color));
        this.setCSS('color-scroll-thumb-hover', toHex(appSkin.panelBackgroundColor.color, 10));
        this.setCSS('scroll-radius', '20px');
        this.setCSS('thumb-width', '10px');
      }
    },
    updateSessionColors() {
      window.localStorage.setItem('sessionColors', JSON.stringify(this.masterColors));
      // this.checkStorage();
    },
    updateStorage() {
      var storage = window.localStorage, self = this;
      storage.setItem('contextmenu', JSON.stringify(self.context.menu));
      storage.setItem('sessionColors', JSON.stringify(self.masterColors));
      storage.setItem('persistent', JSON.stringify(self.persistent));
      storage.setItem('theme', self.activeTheme);
      storage.setItem('appName', self.activeApp);
      storage.setItem('reversed', JSON.stringify(self.reversed));
      console.log(`Updating local storage:
        Colors: ${this.masterColors.join(', ')}
        Persistent: ${this.persistent}
        SortBy: ${this.sortBy}
        Theme: ${this.activeTheme}
        Reversed: ${this.reversed}`)
    },
    readStorage() {
      var storage = window.localStorage;
      if (!storage.length) {
        console.log('There is no pre-existing session data');
        storage.setItem('contextmenu', JSON.stringify(this.context.menu));
        storage.setItem('sessionColors', JSON.stringify(['#ffffff', '#000000']));
        storage.setItem('persistent', JSON.stringify(false));
        storage.setItem('theme', self.activeTheme);
        storage.setItem('appName', self.activeApp);
        storage.setItem('reversed', self.reversed);
      } else {
        console.log('There is pre-existing session data');
        this.masterColors = JSON.parse(storage.getItem('sessionColors'));
        this.context.menu = JSON.parse(storage.getItem('contextmenu'));
        this.persistent = JSON.parse(storage.getItem('persistent'));
        this.activeTheme = storage.getItem('theme');
        this.appName = storage.getItem('appName');
        this.reversed = JSON.parse(storage.getItem('reversed'))
        // this.reversed = false;
      }
      if (this.activeApp == 'AEFT') {
        // console.log(window)
        // this.context.menu.pop();
        // this.context.menu.push({id: "test", label: "Test", enabled: true, checkable: false, checked: false, ingroup: false})
      }
      //   this.masterColors = ['#ff0000', '#0000ff']
      this.checkSort();
      console.log(storage);
      // console.log(this.persistent);
    },
    checkSort() {
      return this.sortBy = (this.context.menu[7].checked) ? 'Spectrum' : 'Time';
    },
    readConfigFromStorage() {
      console.log('Reading prior persistence');
      csInterface.updateContextMenuItem('persistent', true, self.persistent);
    },
    checkStorage() {
      console.log(window.localStorage);
    },
    cleanMasterColors() {
      var clean = [];
      for (var i = 0; i < this.masterColors.length; i++) {
        var target = this.masterColors[i];
        if ((/\#[\d\w]{6}/.test(target)) || (/(white|none)/.test(target)))
          clean.push(target);
      }
      this.masterColors = clean;
    },
    // Changing this should result in passive fill/stroke scanning
    checkForNewColors(msg) {
      this.cleanMasterColors();
      var stroke = msg.stroke.color, fill = msg.fill.color, local, errF = 0, errS = 0, valid = true;
      var totals = this.masterColors.length;
      // if (msg.fill.active)
      //   local = fill;
      // else
      //   local = stroke;
      // local = '#ffffff'
      if (!/white/.test(fill)) {
        for (var i = 0; i < totals; i++) {
          if (fill !== this.masterColors[i])
            errF++;
        }
      }
      if (!/white/.test(stroke)) {
        for (var i = 0; i < totals; i++) {
          if (stroke !== this.masterColors[i])
            errS++;
        }
        // console.log(`${local} : ${errF} : ${totals}`);
      }
      if (errF == totals) {
        if (!this.reversed)
          this.masterColors.unshift(fill);
        else
          this.masterColors.push(fill)
        Event.$emit('addNewSwatch', fill)
      }
      if (errS == totals) {
        if (!this.reversed)
          this.masterColors.unshift(stroke);
        else
          this.masterColors.push(stroke)
        Event.$emit('addNewSwatch', stroke)
      }
      if (!this.hasSelection)
        Event.$emit('clearSwatchesActive', -1);
      console.log(this.masterColors);
      Event.$emit('updateStorage');
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
      var fills = [], strokes = [];
      for (var i = 0; i < msg.length; i++) {
        for (let [key, value] of Object.entries(msg[i])) {
          if ((key == 'fill') && (!fills.includes(value)))
            fills.push(value);
          if ((key == 'stroke') && (!strokes.includes(value)))
            strokes.push(value);
        }
      }
      fills = this.stripNoAppearanceFrom(fills), strokes = this.stripNoAppearanceFrom(strokes);
      this.currentFills = fills, this.currentStrokes = strokes;
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
    updateInSelectionColors(msg) {
      if (/\,/.test(msg)) {
        try {
          msg = JSON.parse(msg);
        } catch(err) {
          msg = msg.split(',')
        }
      }
      if (/^\#\w{6}$/.test(msg)) {
        msg = [msg]
      }
      console.log(msg)
      // else if (/\#/.test(msg))
      if (this.$root.activeApp == 'ILST') {
        this.checkForMultipleAppearances(msg);
      }
      Event.$emit('updateSelectedColors', msg);
    },
    getSelectedColors(msg='') {
      console.log(msg)
      var self = this;
      if (this.activeApp == 'ILST') {
        csInterface.evalScript(`scanSelectedColors('${msg}')`, self.updateInSelectionColors);
      } else {
        csInterface.evalScript(`scanSelectionforColors()`, self.updateInSelectionColors);
      }
    },
    getAllAEColors() {
      var self = this;
      console.log('Requesting all AE colors');
      if (this.activeApp == 'AEFT')
        csInterface.evalScript(`scanAllColors()`, self.readAllAEColors);
    },
    readAllAEColors(msg) {
      console.log('Receiving all colors');
      if (/\,/.test(msg)) {
        msg = msg.split(',');
        msg = this.removeDuplicatesInArray(msg);
        msg = this.removeEmptyValues(msg);
      } else {
        msg = [msg]
      }
      console.log(msg)
      Event.$emit('constructSwatches', msg);
    },
    getAllAIColors() {
      var self = this;
      console.log('Requesting all colors');
      if (this.activeApp == 'ILST')
        csInterface.evalScript(`scanAllColors()`, self.readAllAIColors);
    },
    getAllPSColors() {
      var self = this;
      console.log('Requesting all colors');
      if (this.activeApp == 'PHXS')
        csInterface.evalScript(`scanAllColors()`, self.readAllPSColors);
      else if (this.activeApp == 'AEFT')
        this.getAllAEColors();
    },
    readAllAIColors(msg) {
      console.log('Receiving all colors');
      if (/\,/.test(msg))
        msg = JSON.parse(msg);
      Event.$emit('constructSwatches', msg);
    },
    readAllPSColors(msg) {
      console.log('Receiving all colors');
      if (/\,/.test(msg))
        msg = msg.split(',')
      console.log(msg);
      Event.$emit('constructSwatchesPS', msg);
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
      // console.log('setting context menu');
      csInterface.setContextMenuByJSON(self.menuString, self.contextMenuClicked);
      csInterface.updateContextMenuItem('persistent', true, self.persistent);
      this.handleConfig();
    },
    handleConfig() {
      var sort = this.findMenuItemById('sortbytime');
      if (sort.checked) {
        Event.$emit('setSortByTime', true);
      } else {
        Event.$emit('setSortBySpectrum', true);
      }
    },
    handleResize(evt) {
      if (this.$root.activeApp == 'AEFT') {
        // console.log(`w: ${this.panelWidth}, h: ${this.panelHeight}`);
        this.panelHeight = document.documentElement.clientHeight;
        this.setCSSHeight();
        console.log(evt);
      } else {
        this.panelWidth = document.documentElement.clientWidth;
        this.panelHeight = document.documentElement.clientHeight;
        this.setCSSHeight();
      }
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
        if (((!this.macOS) && (evt.ctrlKey)) || ((this.macOS) && (evt.metaKey))) {
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
    findMenuItemParentById(id) {
      var result;
      for (var i = 0; i < this.context.menu.length; i++) {
        for (let [key,value] of Object.entries(this.context.menu[i])) {
          if (key == "menu") {
            for (var v = 0; v < value.length; v++) {
              for (let [index,data] of Object.entries(value[v])) {
                if ((index == "id") && (data == id))
                  result = this.context.menu[i];
              }
            }
          }
          if ((key == "id") && (value == id)) {
            result = this.context.menu[i];
          }
        }
      }
      return result;
    },
    findMenuItemById(id) {
      var result;
      for (var i = 0; i < this.context.menu.length; i++) {
        for (let [key,value] of Object.entries(this.context.menu[i])) {
          if (key == "menu") {
            for (var v = 0; v < value.length; v++) {
              for (let [index,data] of Object.entries(value[v])) {
                if ((index == "id") && (data == id))
                  result = value[v];
              }
            }
          }
          if ((key == "id") && (value == id)) {
            result = this.context.menu[i];
          }
        }
      }
      return result;
    },
    toggleMenuItemSiblings(parent, exclude, state) {
      if (parent.length) {
        for (var i = 0; i < parent.length; i++) {
          if (parent[i].id !== exclude)
            csInterface.updateContextMenuItem(parent[i].id, true, !state);
        }
      }
    },
    contextMenuClicked(id) {
      var target = this.findMenuItemById(id);
      var parent = this.findMenuItemParentById(id);
      if (id == 'test') {
        console.log('Trying to resize')
        csInterface.resizeContent(30, 200);
      }
      console.log(`Clicked on ${target.label} with check: ${target.checked}`);
      if ((target.checkable) && (target.ingroup) && (!target.checked)) {
        // console.log('this is currently ' + target.checked);
        target.checked = !target.checked;
        this.toggleMenuItemSiblings(parent.menu, target.id, target.checked);
        // console.log('this is checkable and should toggle siblings');
      } else if ((target.checkable) && (!target.checked)) {
        target.checked = !target.checked;
        // console.log(`Toggling to ${target.checked}`);
      } else {
        // console.log(`This is a non-checkable action: ${target.label}`);
      }
      if (id == 'refresh') {
        location.reload();
      }
      if (id == 'reverse') {
        this.reversed = !this.reversed;
        Event.$emit('reverseCurrentSwatches');
      }

      // This is a mess
      if (id == 'allcolors') {
        // this.getAllAIColors();
        console.log('Resetting colors via event');
        Event.$emit('resetColors');
      } else if (id == 'persistent') {
        this.persistent = !this.persistent;
        target.checked = !target.checked;
        // console.log(this.persistent);
        // console.log(target);
        // console.log('Hello');
      }
      if (id == 'scanselection') {
        if (this.scanning.selection)
          Event.$emit('stopSelectionScan');
        else
          Event.$emit('startSelectionScan');
        this.scanning.selection = !this.scanning.selection;
      }
      if (id == 'scanfillstroke') {
        if (this.scanning.fillstroke)
          Event.$emit('stopFillStrokeScan');
        else
          Event.$emit('startFillStrokeScan');
        this.scanning.fillstroke = !this.scanning.fillstroke;
      }
      //
      if (id == 'sortbytime') {
        var toggle = true;
        console.log(target.checked);
        if (target.checked) {
          toggle = !target.checked;
          // this.defaultSort = !toggle;
          // csInterface.updateContextMenuItem(id, true, toggle);
          csInterface.updateContextMenuItem('sortbytime', true, !toggle);
          this.context.menu[7].checked = toggle;
          csInterface.updateContextMenuItem('sortbyspectrum', true, toggle);
          Event.$emit('setSortByTime', true);
          this.sortBy = 'Time';
        // } else if (target.checked) {
        //   console.log('Not default sort');
        } else {
          console.log('Already checked');
          csInterface.updateContextMenuItem(id, true, true);
          // target.checked = true;
        }
      } else if (id == 'sortbyspectrum') {
        var toggle = false;
        console.log(target.checked);
        if (target.checked) {
          toggle = !target.checked;
          // this.defaultSort = !toggle;
          csInterface.updateContextMenuItem('sortbyspectrum', true, !toggle);
          this.context.menu[6].checked = toggle;
          csInterface.updateContextMenuItem('sortbytime', true, toggle);
          Event.$emit('setSortBySpectrum', true);
          this.sortBy = 'Spectrum';
        // } else if (target.checked) {
        //   console.log('Not default sort');
        } else {
          console.log('Already checked');
          csInterface.updateContextMenuItem(id, true, true);
          // target.checked = true;
        }
      }

      if ((/sortby/.test(id)) || (/reverse/.test(id))) {
        Event.$emit('swatchClearHoverEvt');
      }
      this.updateStorage();
      // this.setContextMenu();
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
    removeEmptyValues(keyList, mirror = []) {
      // console.log(keyList);
      for (var i = 0; i < keyList.length; i++) {
        var targ = keyList[i];
        if ((/\s/.test(targ)) || (targ.length < 6)) {
          // console.log('Empty');
        } else {
          mirror.push(targ);
        }
      }
      return mirror;
    },
    removeDuplicatesInArray(keyList) {
      try {
        var uniq = keyList
        .map((name) => {
          return {count: 1, name: name}
        })
        .reduce((a, b) => {
          a[b.name] = (a[b.name] || 0) + b.count
          return a
        }, {})
        var sorted = Object.keys(uniq).sort((a, b) => uniq[a] < uniq[b])
      } catch(err) {
        sorted = keyList
      } finally {
        return sorted;
      }
    },
    getCSS(prop) {
      return window.getComputedStyle(document.documentElement).getPropertyValue('--' + prop);
    },
    setCSS(prop, data) {
      document.documentElement.style.setProperty('--' + prop, data);
    },
  }
});
