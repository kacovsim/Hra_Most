// Collection of helper functions and mixins


// Component for rotating entity towards player
AFRAME.registerComponent('billboard-to-camera', {
  tick: function () {
    const cameraEl = this.el.sceneEl.camera && this.el.sceneEl.camera.el;
    if (!cameraEl) return;

    // Copy camera's world quaternion to this popup
    const worldQuat = new THREE.Quaternion();
    cameraEl.object3D.getWorldQuaternion(worldQuat);
    this.el.object3D.quaternion.copy(worldQuat);
  }
});


//function for setting entity rotation towards camera
function faceCameraOnce(el) {
  console.log("Facing camera");
  if (!el.sceneEl.camera) {
    el.sceneEl.addEventListener('loaded', () => faceCameraOnce(el), { once: true });
    return;
  }

  const cameraEl = el.sceneEl.camera.el;

  // Get world positions
  const objPos = new THREE.Vector3();
  const camPos = new THREE.Vector3();

  el.object3D.getWorldPosition(objPos);
  cameraEl.object3D.getWorldPosition(camPos);

  // Compute direction from object to camera
  const dir = new THREE.Vector3().subVectors(camPos, objPos);
  dir.y = 0; // ignore Y-axis so it stays upright

  // Compute quaternion toface new direction
  const targetQuat = new THREE.Quaternion();
  targetQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());

  el.object3D.quaternion.copy(targetQuat);
}


// generic component just for button animation - enlarge on gaze, push n comeup on click
AFRAME.registerComponent('button-animation', {
    schema: {
        animation_duration: { type: 'number', default: 200 },
        gaze_depth: {type: 'number', default: 1.1},
        click_depth: {type: 'number', default: 0.8}
    },

    init: function () {
      const el = this.el;
      const scale = el.object3D.scale;

      el.setAttribute('animation__zoomOnMouseEnter', {
        property: 'scale',
        to: {x:scale.x*this.data.gaze_depth, y:scale.y*this.data.gaze_depth, z:scale.z*this.data.gaze_depth},
        dur: this.data.animation_duration,
        easing: 'easeOutQuad',
        startEvents: 'mouseenter'
      });

      el.setAttribute('animation__zoomOnMouseLeave', {
        property: 'scale',
        to: `${scale.x} ${scale.y} ${scale.z}`,
        dur: this.data.animation_duration,
        easing: 'easeOutQuad',
        startEvents: 'mouseleave'
      });

      el.setAttribute('animation__mouseClick', {
        property: 'scale',
        to: {x:scale.x*this.data.click_depth, y:scale.y*this.data.click_depth, z:scale.z*this.data.click_depth},
        dur: this.data.animation_duration/2,
        dir: 'alternate',
        loop: 2,
        easing: 'easeOutQuad',
        startEvents: 'click'
      });
    }
});

// color animation for UI buttons
AFRAME.registerComponent('ui-button-color-animation', {
  schema: {
    color_hover: {type: 'string', default: '#FFD700'},
    color_click: {type: 'string', default: '#FF4500'},
    color_default: {type: 'string', default: '#5c5959'},
    animation_duration: {type: 'number', default: 100}
  },

  init: function () {
    const el = this.el;

    // Intercept events and only react when THIS element is the target
    el.addEventListener('mouseenter', evt => {
      if (evt.target !== el) return;
      el.emit('self-mouseenter', null, false); // no bubbling
    });

    el.addEventListener('mouseleave', evt => {
      if (evt.target !== el) return;
      el.emit('self-mouseleave', null, false);
    });

    el.addEventListener('click', evt => {
      if (evt.target !== el) return;
      el.emit('self-click', null, false);
    });

    // Hover animation
    el.setAttribute('animation__hover', {
      property: 'material.color',
      to: this.data.color_hover,
      dur: 0,
      startEvents: 'self-mouseenter'
    });

    // Mouse leave animation
    el.setAttribute('animation__mouseleave', {
      property: 'material.color',
      to: this.data.color_default,
      dur: 0,
      startEvents: 'self-mouseleave'
    });

    // Click animation
    el.setAttribute('animation__click', {
      property: 'material.color',
      to: this.data.color_click,
      dur: this.data.animation_duration,
      dir: 'alternate',
      loop: 2,
      easing: 'linear',
      startEvents: 'self-click'
    });
  }
});



// -- UI --
// X button
AFRAME.registerComponent('popup-x-button', {
  schema: {
    width: {type: 'number', default: 0.360},
    height: {type: 'number', default: 0.160}
  },

  init: function () {
    const data = this.data;
    const popup_X_plane = this.el;

    // Plane
    popup_X_plane.setAttribute('geometry', {
      primitive: 'plane',
      width: data.width,
      height: data.height
    });
    popup_X_plane.setAttribute('material', {
      color: '#5c5959',
      transparent: false
    });
    popup_X_plane.setAttribute('ui-button-color-animation', {
      color_default: "#5c5959",
      color_click: "#690000",
      color_hover: "#bb0000"
    });

    // Text
    const popup_X_text = document.createElement('a-entity');
    popup_X_text.setAttribute('text', {
      value: 'X',
      font: 'static/fonts/RobotoFlex-msdf.json',
      negate: false,
      align: 'center',
      color: '#FFF',
      width: 2,
      wrapCount: 26
    });
    popup_X_text.setAttribute('position', '0 0.04 0.01');

    popup_X_plane.appendChild(popup_X_text);
  }
});


// helper component for autocentering entities
AFRAME.registerComponent('auto-center', {
    init: function () {
        this.el.addEventListener('model-loaded', () => {
            const mesh = this.el.getObject3D('mesh');
            if (!mesh) return;

            const box = new THREE.Box3().setFromObject(mesh);

            const center = box.getCenter(new THREE.Vector3());

            mesh.worldToLocal(center);
            
            mesh.position.x -= center.x;
            mesh.position.z -= center.z;

            const box2 = new THREE.Box3().setFromObject(mesh);
            const minY = box2.min.y;

            mesh.position.y -= minY;
        });
    }
});

// component for resetting camera position after blink teleport
AFRAME.registerComponent('fix-teleport-offset', {
    init: function () {
        this.rig = document.querySelector('#rig');
        this.camera = document.querySelector('#camera');
        this.offset = new THREE.Vector3();

        this.el.addEventListener('teleported', () => {
            this.rig.object3D.position.x -= this.offset.x;
            this.rig.object3D.position.z -= this.offset.z;

            this.camera.object3D.position.x = 0;
            this.camera.object3D.position.z = 0;
        });
    },

    tick: function () {
        this.offset.copy(this.camera.object3D.position);
    }
});

// DEBUG component for toggling fuse-cursor
AFRAME.registerComponent('toggle-fuse-cursor', {
  init: function () {
    this.cameraEl = this.el;

    this.onClick = this.onClick.bind(this);
    this.cameraEl.addEventListener('click', this.onClick);
  },

  onClick: function () {
    const cursorEl = document.querySelector('#fuseCursor');
    const cursorElRing = document.querySelector('#fuseCursorRing');

    if (!cursorEl) {
      console.warn('No #fuseCursor entity found');
      return;
    }

    const isVisible = cursorEl.getAttribute('visible');

    if (isVisible) {
      // Turn OFF
      cursorEl.setAttribute('visible', false);
      cursorElRing.setAttribute('visible', false);

      const raycaster = cursorEl.getAttribute('raycaster') || {};
      raycaster.objects = 'bobo'; // remove .clickable
      cursorEl.setAttribute('raycaster', raycaster);

    } else {
      // Turn ON
      cursorEl.setAttribute('visible', true);
      cursorElRing.setAttribute('visible', true);

      const raycaster = cursorEl.getAttribute('raycaster') || {};
      raycaster.objects = '.clickable';
      cursorEl.setAttribute('raycaster', raycaster);
    }
  },

  remove: function () {
    this.cameraEl.removeEventListener('click', this.onClick);
  }
});



// -- AFRAME MIXINS --
window.addEventListener("DOMContentLoaded", () => {
  const scene = document.querySelector("a-scene");
  const assets = scene.querySelector("a-assets") || document.createElement("a-assets");

  //mixin for teleportpad
  const teleport_pad_mixin = document.createElement("a-mixin");
  teleport_pad_mixin.setAttribute('geometry', 'primitive: cylinder; height: 0.5; radius: 0.5');
  teleport_pad_mixin.setAttribute('material', 'opacity: 0.5; shader: flat; transparent: true; color: #FFC65D');
  teleport_pad_mixin.setAttribute('id', 'teleport_pad_mixin');

  assets.appendChild(teleport_pad_mixin);
  scene.appendChild(assets);
});



console.log("utils.js loaded");






