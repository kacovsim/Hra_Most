// Checkpoint override file

const checkpointOverrides = {
    "B": {
        position: { x: -52.272, y: 0, z: 5.771 },
        node: {
            neighbours: ["A", "C", "E", "F", "G"]
        }
    },

    "C": {
        position: { x: -19.537, y: 0, z: 32.601 },
        node: {
            neighbours: ["B", "D", "E"]
        }
    },

    "D": {
        position: { x: 5.361, y: 0, z: 29.547 },
        node: {
            neighbours: ["A", "C"]
        }
    },

    "E": {
        position: { x: -54.521, y: 0, z: 39.512 },
        node: {
            neighbours: ["B", "C"]
        }
    },

    "F": {
        position: { x: -59.246, y: 0, z: -23.298 },
        node: {
            neighbours: ["B", "G"]
        }
    },

    "G": {
        position: { x: -23.400, y: 0, z: -23.169 },
        node: {
            neighbours: ["B", "F", "H"]
        }
    },

    "H": {
        position: { x: 0.4, y: 0, z: -24.73 },
        node: {
            neighbours: ["G", "A", "J"]
        }
    },

    "I": {
        position: { x: 61, y: 0, z: -2.111 },
        node: {
            neighbours: ["A", "J", "H"]
        }
    },

    "J": {
        position: { x: 42.206, y: 0, z: -21.899 },
        node: {
            neighbours: ["I"]
        }
    },

    "A": {
        position: { x: 0, y: 0, z: 0 },
        node: {
            isActive: true,
            showCheckpoints: true,
            neighbours: ["I", "H", "D", "B"]
        }
    }
};