// Architectural and electroacoustic loudspeaker specifications for room simulation.
// Dimensions are metres [width,height,depth].
export const speakerSpecs={
 'dc12':{name:'DC-12 Point Source',range:[70,20000],size:[.646,.400,.353],beam:{h:100,up:50,down:50,conical:true},dispersion:'100° nominal; circular symmetry',output:'125 dB continuous SPL',power:'400 W RMS'},
 'gc410':{name:'ARRAY-410 Top',range:[75,20000],size:[.7,.7,.43],beam:{h:110,up:10,down:50},dispersion:'110° horizontal / 10° up / 50° down',output:'135 dB continuous SPL',power:'1340 W passive, 4 Ω',crossover:75},
 'obslk':{name:'FS-208 Floorstander',range:[35,20000],size:[.444,.9,.296],beam:null,dispersion:'Wide dispersion studio format',output:'~96 dB sensitivity (1W/1m)',power:'8–100 W, 8 Ω'},
 'gc118-sub':{name:'SUB-118 Subwoofer',range:[32,90],size:[.65,.68,.75],dimensionNote:'650 mm width × 680 mm height × 750 mm depth bass reflex cabinet.',beam:null,dispersion:'Omnidirectional low-frequency radiation',output:'135 dB continuous / 139 dB peak',power:'1500 W, 8 Ω'},
 'gc218':{name:'SUB-218 Dual Subwoofer',range:[32,90],size:[1.3,.6,.75],dimensionNote:'1300 mm wide × 600 mm tall × 750 mm deep high-power sub enclosure.',beam:null,dispersion:'Omnidirectional low-frequency radiation',output:'138 dB continuous / 142 dB peak',power:'3000 W, 4 Ω'}
};
