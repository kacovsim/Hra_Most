// Collection of functions and component for audioguide 

// -- Depricated --
async function fetchAudio(text) {
  const res = await fetch('https://192.168.1.114:8443/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const data = await res.json();

  return new Audio("data:audio/mp3;base64," + data.audio);
}

// non-VR sound
function speak(audio) {
  if (!audio){
    console.log("Called speak on empty audio!");
    return;
  }

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(err => {
      console.error("Audio play failed:", err);
    });
  }
}

// get audio file from external middle man server
async function fetchSpatialAudio(text) {
  const res = await fetch('https://flask-hello-world-seven-beryl-75.vercel.app/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// component for audioguide
AFRAME.registerComponent('tts-button', {
  schema: {
    text: { type: 'string', default: ' text not found!'}  
  },

  init: function () {
    this.isLoading = false;
    this.isPlayingAudio = false;
    this.audio = null;
    this.dotEls = [];
    this.barEls = [];

    this.plane = this.el;
    
    this.speaker = document.createElement('a-entity');
    this.dots = document.createElement('a-entity');
    this.audioPlayIcon = document.createElement('a-entity');
    this.audioStopIcon = document.createElement('a-entity');
    this.bars = document.createElement('a-entity');
    
    this.plane.appendChild(this.speaker);
    this.plane.appendChild(this.dots);
    this.plane.appendChild(this.audioPlayIcon);
    this.plane.appendChild(this.audioStopIcon);
    this.plane.appendChild(this.bars);

    // Plane
    this.plane.setAttribute('geometry', {
      primitive: 'plane',
      width: 0.520,
      height: 0.160
    });
    this.plane.setAttribute('material', {
      color: '#5c5959',
      transparent: false
    });
    this.plane.setAttribute('ui-button-color-animation', {
      color_default: "#5c5959",
      color_click: "#1b1919",
      color_hover: "#cebaba"
    });

    // init dots
    this.dots.setAttribute('id', 'loadingDots');
    this.dots.setAttribute('visible', false);
    this.dots.setAttribute('position', '0 0 0.015');
    this.dotPositions = [-0.1, 0, 0.1];
    this.dotPositions.forEach(x => {
      const dot = document.createElement('a-sphere');
      dot.setAttribute('class', 'dot');
      dot.setAttribute('position', `${x} 0 0`);
      dot.setAttribute('radius', 0.02);
      dot.setAttribute('color', '#FFF');
      dot.setAttribute('shader', 'flat');
      this.dots.appendChild(dot);
      this.dotEls.push(dot);
    });

    // Speaker
    this.speaker.addEventListener('sound-ended', () => {
      this.setPlayingState(false);
      console.log('Playback finished');
    });

    // EQualizer bars
    this.bars.setAttribute('position', '0.08 -0.02 0.015');
    this.bars.setAttribute('visible', true);
    this.barPositions = [-0.03, 0, 0.03];
    this.barPositions.forEach(x => {
      const bar = document.createElement('a-box');
      bar.setAttribute('class', 'bar');
      bar.setAttribute('position', `${x} 0 0`);
      bar.setAttribute('width', 0.02);
      bar.setAttribute('depth', 0.02);
      bar.setAttribute('height', 0.01);
      bar.setAttribute('material', {
        color: '#f8f8f8',
        shader: 'flat'
      });
      this.bars.appendChild(bar);
      this.barEls.push(bar);
    });

    // init audio icon
    this.audioPlayIcon.setAttribute('geometry', { primitive: 'triangle' });
    this.audioPlayIcon.setAttribute('material', { color: 'white', shader: 'flat' });
    this.audioPlayIcon.setAttribute('position', '-0.15 0 0.01');
    this.audioPlayIcon.setAttribute('scale', '0.1 0.1 0.1');
    this.audioPlayIcon.setAttribute('rotation', '0 0 -90');
    this.audioPlayIcon.setAttribute('visible', true);

    this.audioStopIcon.setAttribute('geometry', { primitive: 'box', depth: 0.1 });
    this.audioStopIcon.setAttribute('material', { color: 'white', shader: 'flat' });
    this.audioStopIcon.setAttribute('position', '-0.15 0 0.01');
    this.audioStopIcon.setAttribute('scale', '0.1 0.1 0.1');
    this.audioStopIcon.setAttribute('visible', false);
    
    this.plane.addEventListener('click', async (evt) => {
      if (evt.target !== this.el) return; 
      if (this.isLoading) return; 

      if (!this.isPlayingAudio) {
        // Fetch audio if not fetched
        console.log(new Date().toLocaleTimeString());
        if (this.audio === null) {
          this.setLoadingState(true);
          try {
            this.audio = await fetchSpatialAudio(this.data.text);
            console.log("done waiting for cloud");
            this.speaker.setAttribute('sound', { src: this.audio });
            await this.waitForSoundLoaded(this.speaker);
            console.log("done waiting for sound load");
            console.log(new Date().toLocaleTimeString());
          } catch (err) {
            console.error(err);
          }
          this.setLoadingState(false);
        }
        
        this.setPlayingState(true);
      }
      else { 
        this.setPlayingState(false);
      }
  
    });
  },

  startDotWave() {
    const dots = this.dotEls;
    const forwardZ = 0.05;

    dots.forEach((dot, index) => {
      const base = this.dotPositions[index];
      // move forward
      dot.setAttribute('animation__forward', {
        property: 'position',
        to: `${base} 0 ${forwardZ}`,
        dur: 360,
        dir: 'alternate',
        loop: true,
        delay: index * 120,
        easing: 'easeOutQuad'
      });
    });
  },

  stopDotWave() {
    this.dotEls.forEach(dot => {
      dot.removeAttribute('animation__forward');
      dot.removeAttribute('animation__back');
      dot.setAttribute('position', '0 0 0');
    });
  },

  startBarWave() {
    if (this.barInterval) return;

    this.barInterval = setInterval(() => {
      this.barEls.forEach((bar, i) => {
        const x = this.barPositions[i];
        const h = 0.01 + Math.random() * 0.06; 
        bar.setAttribute('height', h);
        bar.setAttribute('position', {
          x: x,
          y: h / 2,   
          z: 0
        });
      });

    }, 100); 
  },

  stopBarWave() {
    clearInterval(this.barInterval);
    this.barInterval = null;
    this.barEls.forEach((bar, i) => {
      const x = this.barPositions[i];
      bar.setAttribute('height', 0.01);
      bar.setAttribute('position', {
        x: x,
        y: 0.01,
        z: 0
      });
    });
  },


  setLoadingState(isLoading) {
    if (isLoading) {
      console.log("LOADING aUDIO...");  
      this.dots.setAttribute('visible', true);
      this.audioPlayIcon.setAttribute('visible', false);
      this.audioStopIcon.setAttribute('visible', false);
      this.bars.setAttribute('visible', false);
      this.startDotWave();
      this.isLoading = true;
    } else {
      console.log("DONE LOADING aUDIO...");
      this.dots.setAttribute('visible', false);
      this.stopDotWave();
      this.isLoading = false;
    }
  },

  setPlayingState(state) {
    if (state) {
      console.log("Playing aUDIO...");
      this.speaker.components.sound.playSound();  
      this.audioPlayIcon.setAttribute('visible', false);
      this.audioStopIcon.setAttribute('visible', true);
      this.bars.setAttribute('visible', true);
      this.isPlayingAudio = state;
      this.startBarWave();
    } else {
      console.log("DONE Playing aUDIO...");
      this.speaker.components.sound.stopSound();
      this.audioStopIcon.setAttribute('visible', false);
      this.audioPlayIcon.setAttribute('visible', true); 
      this.isPlayingAudio = state;
      this.stopBarWave();
    }
  },

  waitForSoundLoaded(el) {
    return new Promise(resolve => {
      const sound = el.components.sound;

      // already loaded case
      if (sound && sound.buffer) {
        resolve();
        return;
      }

      el.addEventListener('sound-loaded', () => {
        resolve();
      }, { once: true });
    });
  }
});