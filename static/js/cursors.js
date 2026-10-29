// File containing custom cursors

// Main cursor used in mobile VR
AFRAME.registerComponent("fuse-cursor", {
  init: function () {
    // create the entity
    const distancefromCamera = -1.5;
    const scaleMax = 5;
    const sphereDefaultRadius = 0.005;
    const ringThickness = 0.005;

    const cursorEl = document.createElement("a-entity");

    cursorEl.setAttribute("id", "fuseCursor");
    cursorEl.setAttribute("raycaster", "objects: .clickable");
    cursorEl.setAttribute("cursor", "fuse: true; fuseTimeout: 1200");
    cursorEl.setAttribute("position", `0 0 ${distancefromCamera}`);
    cursorEl.setAttribute("geometry", `primitive: sphere; radius: ${sphereDefaultRadius}`);
    cursorEl.setAttribute("material", "color: #c5bebe; shader: flat");

    const ring = document.createElement('a-entity');
    ring.setAttribute("id", "fuseCursorRing");
    ring.setAttribute('geometry', `primitive: ring; radiusOuter: ${sphereDefaultRadius * scaleMax + ringThickness}; radiusInner: ${sphereDefaultRadius * scaleMax}`);
    ring.setAttribute('material', "color: #c5bebe; side: double; shader: flat");
    ring.setAttribute('position', `0 0 ${distancefromCamera}`);

    // fuse animation (scale up)
    cursorEl.setAttribute(
      "animation__select",
      `property: scale; from: 1 1 1; to: ${scaleMax} ${scaleMax} ${scaleMax}; startEvents: fusing; dur: 1000;`,
    );

    // deselect animation (scale back)
    cursorEl.setAttribute(
      "animation__deselect",
      `property: scale; from: ${scaleMax} ${scaleMax} ${scaleMax}; to: 1 1 1; startEvents: mouseleave; dur: 200;`,
    );

    // attach to camera or scene
    this.el.appendChild(cursorEl);
    this.el.appendChild(ring);
  },
});

// support cursor for mobile VR used for instant mouseenter and mouseleave - showing popups
AFRAME.registerComponent("gaze-cursor", {
  init: function () {
    const gazeCursor = document.createElement("a-entity");

    gazeCursor.setAttribute("id", "gazeCursor");
    gazeCursor.setAttribute("raycaster", "objects: .gazeable");
    gazeCursor.setAttribute("cursor", "fuse: false");
    gazeCursor.setAttribute("position", "0 0 -1");

    this.el.appendChild(gazeCursor);
  },
});

// cursor for fallback solution
AFRAME.registerComponent("mouse-cursor", {
  init: function () {
    const mouseCursor = document.createElement("a-entity");

    mouseCursor.setAttribute("id", "mouseCursor");
    mouseCursor.setAttribute("cursor", "rayOrigin: mouse");
    mouseCursor.setAttribute("raycaster", "objects: .gazeable, .clickable");

    this.el.appendChild(mouseCursor);
  },
});

// experimental curor for voice activated mouseclick event
AFRAME.registerComponent("voice-cursor", {
  schema: {
    fuseDuration: { type: "number", default: 1000 }
  },

  init: function () {
    const gazeCursor = document.createElement("a-entity");

    gazeCursor.setAttribute("id", "voiceCursor");
    gazeCursor.setAttribute("raycaster", "objects: .clickable");
    gazeCursor.setAttribute("cursor", "fuse: false");
    gazeCursor.setAttribute("position", "0 0 -1");
    gazeCursor.setAttribute("geometry", "primitive: sphere; radius: 0.01;");
    gazeCursor.setAttribute("material", "color: white; shader: flat");

    this.el.appendChild(gazeCursor);
    this.gazeCursor = gazeCursor;
  },

  triggerFuseClick: function () {
    console.log("Executing voice Click...");

    const cursorEl = this.gazeCursor;
    const raycaster = cursorEl?.components?.raycaster;

    console.log("raycaster:", raycaster);
    if (!raycaster) return;

    const targetEl = raycaster.intersectedEls?.[0];
    console.log("targetEl:", targetEl);
    if (!targetEl) return;

    console.log("voice click!");

    // start fuse animation
    cursorEl.emit("fusing");

    setTimeout(() => {
      targetEl.emit("click", {
        sourceEl: cursorEl,
        intersection: raycaster.getIntersection(targetEl)
      });

      cursorEl.emit("mouseleave");
    }, this.data.fuseDuration);
  }
});


console.log("Cursors loaded!");
