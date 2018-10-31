## requests:

* Rework swatchList style to support infinite height
* Gray colors are too hard to see? Provide contrast frame if swatch value is same as bg.
* Add CMYK backdoor if document color type
* ~~Verify mac command modifier key works (mask as Ctrl on root.parseModifiers)~~
* Persistent across sessions [toggle]
* Sketch preview
* Determine if multifill/stroke is possible to detect

## to-do

* Load config of context menu settings on mounted()
* Context menu toggle for Sort By breaks easily
* Support textFrame scanning
* ~~Sort by spectrum~~
* Delete/snip swatch
* MagicMirror UI background color
* Alt + Swatchclick: Delete / Replace
* Trace Paper -- replaces colorHistory "Highlight". Generate layer above current artwork, replicate paths and fills/strokes, place solid white w/ artboard dimensions and lowered opacity beneath. Delete layer when not hovering.
* ~~Fix swatchList if no colors preset~~
* ~~Fix swatch.key inaccuracies on addNewSwatch~~
* ~~Reverse~~
* ~~Graveyard all unused components~~
* ~~Selection change timer and visualizer~~
* ~~Fill/Stroke change timer and visualizer~~
* ~~All colors in selection (common)~~
* ~~Tabs -- Timer / Spectrum~~
* ~~Swatches should support icons and outlines on hover~~
* ~~Delete swatch needs SVG cancel icon~~
* ~~Mod key visualizers -- select multiple swatches and find/replace~~
* ~~All colors in document scan (rare)~~
* ~~SwatchList -- Colors in document/artboard~~
* ~~SwatchList -- All recent colors~~
* ~~Shift + Swatchclick: Add swatch to selected~~
* ~~Control + Swatchclick: Select items with this color~~
* ~~Component swatchList and swatch -- compute time/spectrum arrays from masterswatches~~


## schematic

```bash
    # component schematic
    app >
      Header >
        SortBy >
          > Recent [SVG]
          > Spectrum [SVG]
        InSelection >
          > Colors [CSS GRID]
        Visualizers >
          > Fill / Stroke [SVG]
          > Modifier Keys [GRID]
          > Scanning On/Off [SVG]
      Body >
        SwatchList >
          > Nav arrows
          swatches in Current [GRID] >
            > Handle with icon or icon centered inside
        SwatchList >
          swatches in Document (unless layer selected)
            > Handle with icon or icon centered inside
      Footer >
        > Info
        TestToolbar >
          > TestBtn

    # icons
    Swatch >
      > default: apply as active
      > shift: plus +
      > control: select/cursor
      > alt: minus x
      > replace
      > find

```
