
// HOW TO
// a-entity with "node=isActive: true" needs to be "node" entity, otherwise the arrows wont work cause neighbours dont exist yet


let showCheckpointPads = false;

// Ensure the component exists globally
if (!AFRAME.components['button-animation']) {
  throw new Error(
    'button-animation is not registered! Did you forget to load button-animation.js before this script?'
  );
}

// add to base a-entity to make it a directional arrow
// as model uses file "directionArrow.glb". Can be replaced in /static/models/
AFRAME.registerComponent('direction-arrow', {
  schema: {
    scale: {type: 'number', default: 0.2 },
    targetNodeId: {type: 'string'}
  },

  init: function () {
      const el = this.el;

      el.setAttribute('gltf-model', '/static/models/directionArrow.glb');
      el.setAttribute('scale', {x:this.data.scale, y:this.data.scale, z:this.data.scale});
      el.setAttribute('button-animation', {
        animation_duration: 200,
        gaze_depth: 1.2,
        click_depth: 0.7
      });
      el.classList.add('gazeable', 'clickable')
    }
});

// main checkpoint component - defines node in checkpoint system graph
AFRAME.registerComponent('node', {
  schema: {
    neighbours: {type: 'array'},
    isActive: {type: 'boolean', default: false},
    showCheckpoints: {type: 'boolean'}
  },

  init: function () {
    this.areArrowsGenerated = false;
    const el = this.el;
    const neighbours = this.data.neighbours;

    // get camera rig
    const rig = document.querySelector('#rig');

    // create child of teleportpad
    const teleportPad = document.createElement('a-entity');
    teleportPad.setAttribute('mixin', 'teleport_pad_mixin');
    teleportPad.setAttribute('visible', 'false');
    el.appendChild(teleportPad);

    // create child of arrowsWrapper
    const arrowsWrapper = document.createElement('a-entity');
    arrowsWrapper.setAttribute('visible', 'false');
    el.appendChild(arrowsWrapper);

    // set global variable if checkpoints should be shown - hardcoded default: false
    if (this.data.showCheckpoints) {
      showCheckpointPads = this.data.showCheckpoints;
    }

    if (!neighbours || neighbours.length === 0) {
      console.log(neighbours);
      throw new Error("No neighbours defined for this node!");
    }


    // create arrow for each neighbour and rotate it towards him
    // public method
    this.setActive = () => {
      //turn off teleportPad and turn on Arrows
      arrowsWrapper.setAttribute('visible', 'true');
      this.turnOffTeleportPad();

      // turn on visual queue
      neighbours.forEach(neighbourNodeID => {
        document.querySelector(`#${neighbourNodeID}`).components['node'].turnOnTeleportPad();
      });

      const targetPos = el.getAttribute('position');
      
      // move player to target position
      rig.setAttribute('position', {
        x: targetPos.x,
        y: rig.object3D.position.y,
        z: targetPos.z
      });

      if (this.areArrowsGenerated) {
        console.log("Arrows already generated");
        return;
      }
      
      // run only first time is set active 
      // generate arrow entities for neighbouring checkpoints
      console.log("Generating arrows...");
      neighbours.forEach(neighbourNodeID => {
        const neighbourNode = document.querySelector(`#${neighbourNodeID}`);
        
        const arrow = document.createElement('a-entity');
        const arrowGlb = document.createElement('a-entity');
        
        arrow.appendChild(arrowGlb);
        arrowGlb.setAttribute('direction-arrow', {targetNodeId: neighbourNodeID});
        arrowGlb.setAttribute('position', '0 0 -1.2');
    
        arrowsWrapper.appendChild(arrow);  

        // fix incorrect glb model rotation
        console.log(neighbourNode);
        arrow.object3D.lookAt(neighbourNode.object3D.position);
        arrow.object3D.rotateY(Math.PI);

        this.areArrowsGenerated = true;
      });
    };

    // main control function
    const move = (id) => {
      arrowsWrapper.setAttribute('visible', 'false');
      this.turnOnTeleportPad();

      // BAD for each neightbour turn off teleporter
      neighbours.forEach(neighbourNodeID => {
        document.querySelector(`#${neighbourNodeID}`).components['node'].turnOffTeleportPad();
      });
      
      const neighbourTargetNode = document.querySelector(`#${id}`);
      
      // create arrows etc. on new position and move player
      neighbourTargetNode.components['node'].setActive();

      document.dispatchEvent(new CustomEvent("playerMoved"));
      console.log(`Moved to #${id}`);
    }

    this.turnOnTeleportPad = () => {
      if (showCheckpointPads){
        teleportPad.setAttribute('visible', 'true');
      }
    }

    this.turnOffTeleportPad = () => {
      teleportPad.setAttribute('visible', 'false');
    }

    if (this.data.isActive) {
      this.setActive();
    }

    el.addEventListener('click', (evt) => {
      move(evt.target.components['direction-arrow'].data.targetNodeId)
    });
  }

});

// Controller for generating checkpoints from override file
AFRAME.registerComponent('checkpoint-controller', {
    init: function () {
        if (typeof checkpointOverrides === 'undefined') {
            console.warn('checkpointOverrides not found');
            return;
        }

        const parent = this.el;

        // for each entry in override file, generate checkpoint
        Object.entries(checkpointOverrides).forEach(([id, data]) => {
            const el = document.createElement('a-entity');

            // set id
            el.setAttribute('id', id);

            // position
            if (data.position) {
                el.setAttribute('position', data.position);
            }

            // checkpoint attributes setup
            if (data.node) {
                const parts = [];

                if (data.node.isActive) {
                    parts.push(`isActive: true`);
                }

                if (data.node.showCheckpoints) {
                    parts.push(`showCheckpoints: true`);
                }

                if (data.node.neighbours) {
                    parts.push(`neighbours: ${data.node.neighbours.join(',')}`);
                }

                el.setAttribute('node', parts.join('; '));
            }

            parent.appendChild(el);

            console.log(`Checkpoint "${id}" created`);
        });
    }
});




console.log("Direction arrow script loaded");