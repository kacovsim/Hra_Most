// Mapping functions for translating raw data from API to logical objects for controllers generating entities
// funtions for fetching additional files

const baseUrl = "https://libuse.vugtk.cz:3000";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NmJkYTQyYy04Y2RjLTQ2YWEtYjFiNi0yZGQyZTFjNDk4ZmMiLCJpYXQiOjE3NzI5NzczMDV9.C7TWmEgmyR9n4owTbZkUslqB1sK-b7fhpF6jEmaB8lQ";

// fetch model by id
async function fetchModel(modelId) {
    try {
        const response = await fetch(baseUrl.concat("/models/", modelId), {headers: {Authorization: `Bearer ${token}`}});
        
        if (!response.ok) {
            throw new Error("Failed to fetch GLB");
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } 
    catch (error) {
        console.error(error.message);
    }
}

// fetch image by id 
async function fetchImage(imgId) {
    try {
        const response = await fetch(baseUrl.concat("/photos/", imgId), {headers: {Authorization: `Bearer ${token}`}});
    
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        // createObjectURL didnt work for unknown reason, need to return blob instead
        const blob = await response.blob();

        return await new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } 
    catch (error) {
        console.error(error.message);
    }
}

// get all structures metadata and filter structures containing valid model file format "GLB"
async function getStructures() {
    try {
        const response = await fetch(baseUrl + "/structures", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const structures = await response.json();

        const modelStructures = structures.filter(item =>
            item.defaultObject != null &&
            item.allVariants?.some(variant => variant.format === "GLB")
        );

        console.log(modelStructures);

        return modelStructures;

    } catch (error) {
        console.error(error.message);
        return [];
    }
}

// all 3DObjects metadata
async function getAll3DObjects() {
    const structures = await getStructures();

    const result = structures
        .map(item =>
            item.allVariants.find(
                v => v.format && v.format.toUpperCase() === "GLB"
            )
        )
        .filter(variant => variant !== undefined);
    
    console.log(result)
    return result;
}

// placeholder function for future translation of gps coordinates to Aframe coords
function gpsToWorld(lat, lon, origin) {
    const R = 6378137; // Earth radius in meters
    const dLat = (lat - origin.lat) * Math.PI / 180;
    const dLon = (lon - origin.lon) * Math.PI / 180;
    const x = dLon * R * Math.cos(origin.lat * Math.PI / 180);
    const z = dLat * R;
    console.log("x:", x, "-z:", -z);
    return {
        x: x,
        y: 0,
        z: -z 
    };
}


// testing mapping function for translating api data into logical buildings objects
async function getMappedBuildings({ useOverride = false } = {}) {
    const structures = await getStructures();

    const origin = {
        lat: structures[0]?.location?.lat,
        lon: structures[0]?.location?.lon
    };

    const buildings = structures
        .filter(structure => {
            if (!useOverride) return true;

            const override = buildingOverrides[structure.name];
            if (!override) return false;

            if (override.structureId && override.structureId !== structure.id) {
                return false;
            }

            return true;
        })
        .map(structure => {
            const glbVariant = structure.allVariants.find(
                v => v.format && v.format.toUpperCase() === "GLB" && v.name.endsWith("TE2.glb")
            );

            if (!glbVariant) return null;

            const translation = glbVariant.transformationWeb?.translation || [0, 0, 0];
            const scaleArr = glbVariant.transformationWeb?.scale || [1, 1, 1];

            let position = {
                x: translation[0],
                y: translation[1],
                z: translation[2]
            };

            let areaID = structure.areaId;

            let rotation = { x: 0, y: 0, z: 0 };

            const gps = gpsToWorld(
                structure.location.lat,
                structure.location.lon,
                origin
            );

            const gpsPosition = {
                x: gps.x,
                y: gps.y,
                z: gps.z
            };

            const override = buildingOverrides[structure.name];

            // override from files
            if (
                useOverride &&
                override &&
                (!override.structureId || override.structureId === structure.id)
            ) {
                if (override.position) position = override.position;
                if (override.rotation) rotation = override.rotation;
                if (override.areaID) areaID = override.areaID;
            }


            // format of internal building objects
            return {
                structureId: structure.id,
                name: structure.name,
                description: structure.description,
                modelId: glbVariant.modelId,
                position,
                gpsPosition,
                areaID,
                rotation,
                scale: {
                    x: scaleArr[0],
                    y: scaleArr[1],
                    z: scaleArr[2]
                }
            };
        })
        .filter(b => b !== null);

    console.log(buildings);
    return buildings;
}

// metadata for all images on API
async function getAllImages() {
    try {
        const response = await fetch(baseUrl.concat("/photos"), {headers: {Authorization: `Bearer ${token}`}});
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const blob = await response.json();
    } 
    catch (error) {
        console.error(error.message);
    }
}

// set global variable of filtered internal building objects
window.mappedOverrideBuildingsPromise = getMappedBuildings({ useOverride:true });
