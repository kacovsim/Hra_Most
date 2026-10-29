// controller for generating and manipulating building entities


// takes internal building object
async function createBuilding(building) {
    const scene = document.querySelector("a-scene");
    const model = document.createElement('a-entity');

    const url = await fetchModel(building.modelId);

    const position = `${building.position.x} ${building.position.y} ${building.position.z}`;
    const rotation = `${building.rotation.x} ${building.rotation.y} ${building.rotation.z}`;
    model.setAttribute('gltf-model', url);
    model.setAttribute('position', position);
    model.setAttribute('rotation', rotation);
    model.classList.add('building');
    model.setAttribute('visible', true);
    model.setAttribute('id', building.name);
    
    scene.appendChild(model);
    console.log(`Building "${building.name}" created! Appended at: `, performance.now());
}

// helper component for centering a model if not at its center pivot
AFRAME.registerComponent('center-model', {
  init: function () {
    this.el.addEventListener('model-loaded', () => {
      const mesh = this.el.getObject3D('mesh');
      const box = new THREE.Box3().setFromObject(mesh);
      const center = box.getCenter(new THREE.Vector3());

      mesh.position.sub(center);
      console.log("Vycentrovano");
    });
  }
});

// fetching and generating building in waterfall order
async function generateBuildingsByArea(areaIds = [], useOverride = false) {
    try {
        const buildings = await getMappedBuildings({ useOverride });

        const filtered = buildings.filter(b => {
            if (Array.isArray(b.areaID)) {
                return b.areaID.some(id => areaIds.includes(id));
            }
            return areaIds.includes(b.areaId);
        });

        console.log("filtered:", filtered);

        let i = 0
        for (const b of filtered) {
            console.log(i, ': model STARTED LOADING at ', performance.now());
            await createBuilding(b);
            i = i+1;
        }

        console.log(`Done loading buildings for areaIds: ${areaIds.join(", ")}`);
    } catch (error) {
        console.error("Error generating buildings:", error);
    }
}

// fetching and generating building all at once
async function generateBuildingsByArea2(areaIds = [], useOverride = false) {
    try {
        const buildings = await getMappedBuildings({ useOverride });

        const filtered = buildings.filter(b => {
            if (Array.isArray(b.areaID)) {
                return b.areaID.some(id => areaIds.includes(id));
            }
            return areaIds.includes(b.areaId);
        });

        console.log("filtered:", filtered);

        let i = 0
        const promises = filtered.map((b, i) => {
            console.log(i, ': model STARTED LOADING at ', performance.now());
            return createBuilding(b);
        });

        await Promise.all(promises);

        console.log(`Done loading buildings for areaIds: ${areaIds.join(", ")}`);
    } catch (error) {
        console.error("Error generating buildings:", error);
    }
}

// fetching and generating building in batches of n
async function generateBuildingsByArea3(areaIds = [], useOverride = false) {
    try {
        const buildings = await getMappedBuildings({ useOverride });

        const filtered = buildings.filter(b => {
            if (Array.isArray(b.areaID)) {
                return b.areaID.some(id => areaIds.includes(id));
            }
            return areaIds.includes(b.areaId);
        });

        console.log("filtered:", filtered);

        const CONCURRENCY = 4; // number of batches

        let globalIndex = 0;
        const startTime = performance.now();

        for (let i = 0; i < filtered.length; i += CONCURRENCY) {
            const batch = filtered.slice(i, i + CONCURRENCY);

            await Promise.all(
                batch.map(async (b, j) => {
                    const index = globalIndex++;
                    const t0 = performance.now();

                    console.log(index, ': model STARTED LOADING at ', t0);

                    await createBuilding(b);

                    const t1 = performance.now();
                    console.log(index, ': model LOADED in ', (t1 - t0).toFixed(0), 'ms');
                })
            );
        }

        const total = performance.now() - startTime;
        console.log(`Done loading buildings for areaIds: ${areaIds.join(", ")}`);
        console.log(`TOTAL TIME: ${total.toFixed(0)} ms`);

    } catch (error) {
        console.error("Error generating buildings:", error);
    }
}


generateBuildingsByArea2([1], { useOverride: true });

console.log("buildings_controller loaded!");