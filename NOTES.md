## TO-DO

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

* ~~Selection change timer and visualizer~~
* ~~Fill/Stroke change timer and visualizer~~
* ~~All colors in selection (common)~~
* ~~Tabs -- Timer / Spectrum~~
* ~~Swatches should support icons and outlines on hover~~
* ~~Delete swatch needs SVG cancel icon~~
* ~~Mod key visualizers -- select multiple swatches and find/replace~~
* All colors in document scan (rare)
* SwatchList -- Colors in document/artboard
* SwatchList -- All recent colors
* Shift + Swatchclick: Add swatch to selected
* Control + Swatchclick: Select items with this color
* Alt + Swatchclick: Delete / Replace
* Component swatchList and swatch -- compute time/spectrum arrays from masterswatches
* Trace Paper -- replaces colorHistory "Highlight". Generate layer above current artwork, replicate paths and fills/strokes, place solid white w/ artboard dimensions and lowered opacity beneath. Delete layer when not hovering.
