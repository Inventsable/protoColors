## requests:

* Variable swatch height
* ~~Verify mac command modifier key works (mask as Ctrl on root.parseModifiers)~~
* ~~Persistent across sessions [toggle]~~

## to-do

* TextFrames do not get selected on ctrl+click
* Swatches have no contrast mechanic if same as background of panel.
* Trace Paper -- replaces colorHistory "Highlight". Generate layer above current artwork, replicate paths and fills/strokes, place solid white w/ artboard dimensions and lowered opacity beneath. Delete layer when not hovering.
* ~~Use computed properties as modifiers for isolated Ctrl, Shift, Alt, Ctrl+Shift, Ctrl+Alt, etc.~~
* ~~Rework swatchList style to support infinite height~~
* ~~Add CMYK backdoor if document color type~~
* ~~Load config of context menu settings on mounted()~~
* ~~Context menu toggle for Sort By breaks easily~~
* ~~Support textFrame scanning~~
* ~~Delete/snip swatch~~
* ~~MagicMirror UI background color~~
* ~~Alt + Swatchclick: Delete / Replace~~
* ~~No interruptions or problems on document change~~
* ~~Fix swatchList if no colors preset~~
* ~~Fix swatch.key inaccuracies on addNewSwatch~~
* ~~Reverse~~
* ~~Sort by spectrum~~
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
