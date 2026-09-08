// Transcribed from the linked manufacturer sheets, reviewed 2026-09-07.
// Dimensions are metres [width,height,depth]. Mesh shapes remain visual stand-ins.
const cdn='https://cdn.sanity.io/files/73w9vlyd/production/';
export const speakerSpecs={
 'dc12':{name:'DC12',range:[70,20000],size:[.646,.400,.353],beam:{h:100,up:50,down:50,conical:true},dispersion:'100° nominal; circular symmetry assumed',output:'125 dB at RMS voltage of limiting element',power:'400 W RMS',sheet:'https://tubs-audio-nz.netlify.app/specs/dc12.pdf'},
 'gc410':{name:'GC410',range:[75,20000],size:[.7,.7,.43],beam:{h:110,up:10,down:50},dispersion:'110° horizontal / 10° up / 50° down',output:'135 dB at RMS voltage of limiting element',power:'1340 W passive, 4 Ω',crossover:75,sheet:cdn+'83c8561ada5fcc02ac26ae85c11fc780d3a34dc6.pdf'},
 'obslk':{name:'OBSLK',range:[35,20000],size:[.444,.9,.296],beam:null,dispersion:'Not specified; omnidirectional comparison assumed',output:'~96 dB sensitivity; measurement reference not supplied',power:'8–100 W, 8 Ω',sheet:'https://tubs-audio-nz.netlify.app/specs/obslk.pdf'},
 'gc118-sub':{name:'GC118 Sub',range:[32,90],size:[.65,.68,.75],dimensionNote:'650 mm width / 750 mm depth from drawing; 680 mm standalone height assumed because only overall stack height is dimensioned.',beam:null,dispersion:'Omnidirectional low-frequency source assumed',output:'135 dB at RMS voltage / 139 dB maximum',power:'1500 W, 8 Ω',sheet:cdn+'238e6d00bf9a590cc3347d5a4557fa5819d28548.pdf'},
 'gc218':{name:'GC218',range:[32,90],size:[1.3,.6,.75],dimensionNote:'Drawing: 600 mm wide × 1300 mm tall × 750 mm deep. Shown on its side in this concept layout; stacking approval not implied.',beam:null,dispersion:'Omnidirectional low-frequency source assumed',output:'138 dB at RMS voltage / 142 dB maximum',power:'3000 W, 4 Ω',sheet:cdn+'50a341748d11f1e2e593e34d178d7ab5d97ac11a.pdf'}
};
