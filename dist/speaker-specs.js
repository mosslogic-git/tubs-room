// Architectural and electroacoustic loudspeaker specifications for room simulation.
// Dimensions are metres [width,height,depth].
export const speakerSpecs={
 'dc12':{name:'DC-12 Point Source',range:[70,20000],size:[.646,.400,.353],beam:{h:100,up:50,down:50,conical:true},dispersion:'100° nominal; circular symmetry',output:'125 dB continuous SPL',power:'400 W RMS'},
 'gc410':{name:'ARRAY-410 Top',range:[75,20000],size:[.7,.7,.43],beam:{h:110,up:10,down:50},dispersion:'110° horizontal / 10° up / 50° down',output:'135 dB continuous SPL',power:'1340 W passive, 4 Ω',crossover:75},
 'obslk':{name:'FS-208 Floorstander',range:[35,20000],size:[.444,.9,.296],beam:null,dispersion:'Wide dispersion studio format',output:'~96 dB sensitivity (1W/1m)',power:'8–100 W, 8 Ω'},
 'adam-a7v':{name:'ADAM Audio A7V',range:[40,45000],size:[.200,.337,.280],beam:{h:120,up:35,down:35,conical:false},dispersion:'120° horizontal / 70° vertical (rotatable HPS waveguide)',output:'105 dB max SPL',power:'130 W bi-amped (110W LF + 20W HF)',crossover:2800},
 'mackie-hr824':{name:'Mackie HR824 Mk2',range:[35,22000],size:[.274,.425,.351],beam:{h:100,up:40,down:40,conical:true},dispersion:'100° nominal; logarithmic waveguide symmetry',output:'120 dB peak SPL',power:'250 W active bi-amped (150W LF + 100W HF)',crossover:1900},
 'adam-sub10':{name:'ADAM Audio Sub10 Mk2',range:[25,150],size:[.300,.560,.400],dimensionNote:'300 mm width × 560 mm height × 400 mm depth studio subwoofer cabinet.',beam:null,dispersion:'Omnidirectional low-frequency radiation',output:'113 dB max SPL',power:'300 W RMS, Class D'},
 'mackie-cr5':{name:'Mackie CR5-X',range:[50,20000],size:[.175,.260,.235],beam:{h:90,up:45,down:45,conical:true},dispersion:'90° desktop directivity',output:'105 dB peak SPL',power:'80 W peak'},
 'gc118-sub':{name:'SUB-118 Subwoofer',range:[32,90],size:[.65,.68,.75],dimensionNote:'650 mm width × 680 mm height × 750 mm depth bass reflex cabinet.',beam:null,dispersion:'Omnidirectional low-frequency radiation',output:'135 dB continuous / 139 dB peak',power:'1500 W, 8 Ω'},
 'gc218':{name:'SUB-218 Dual Subwoofer',range:[32,90],size:[1.3,.6,.75],dimensionNote:'1300 mm wide × 600 mm tall × 750 mm deep high-power sub enclosure.',beam:null,dispersion:'Omnidirectional low-frequency radiation',output:'138 dB continuous / 142 dB peak',power:'3000 W, 4 Ω'}
};
