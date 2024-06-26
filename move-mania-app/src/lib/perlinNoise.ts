export default function createNoise(
    /**
     * A function that returns a value between 0 and 1
     */
    getRandomNumber?: () => number,
): (x: number, y: number) => number {
    const grad3 = [
        [1, 1, 0],
        [-1, 1, 0],
        [1, -1, 0],
        [-1, -1, 0],
        [1, 0, 1],
        [-1, 0, 1],
        [1, 0, -1],
        [-1, 0, -1],
        [0, 1, 1],
        [0, -1, 1],
        [0, 1, -1],
        [0, -1, -1],
    ]
    const p: number[] = []
    for (let i = 0; i < 256; i++) {
        p[i] = Math.floor(getRandomNumber ? getRandomNumber() : Math.random() * 256)
    }
    // To remove the need for index wrapping, double the permutation table length
    const perm: number[] = []
    for (let i = 0; i < 512; i++) {
        perm[i] = p[i & 255]
    }

    function getNoise(xin: number, yin: number) {
        // Noise contributions from the three corners
        let n0: undefined | number
        let n1: undefined | number
        let n2: undefined | number

        // Skew the input space to determine which simplex cell we're in
        let F2 = 0.5 * (Math.sqrt(3.0) - 1.0)
        let s = (xin + yin) * F2 // Hairy factor for 2D
        let i = Math.floor(xin + s)
        let j = Math.floor(yin + s)
        let G2 = (3.0 - Math.sqrt(3.0)) / 6.0
        let t = (i + j) * G2
        let X0 = i - t // Unskew the cell origin back to (x,y) space
        let Y0 = j - t
        let x0 = xin - X0 // The x,y distances from the cell origin
        let y0 = yin - Y0
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1: undefined | number
        let j1: undefined | number // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) {
            i1 = 1
            j1 = 0
        } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else {
            i1 = 0
            j1 = 1
        } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        let x1 = x0 - i1 + G2 // Offsets for middle corner in (x,y) unskewed coords
        let y1 = y0 - j1 + G2
        let x2 = x0 - 1.0 + 2.0 * G2 // Offsets for last corner in (x,y) unskewed coords
        let y2 = y0 - 1.0 + 2.0 * G2
        // Work out the hashed gradient indices of the three simplex corners
        let ii = i & 255
        let jj = j & 255
        let gi0 = perm[ii + perm[jj]] % 12
        let gi1 = perm[ii + i1 + perm[jj + j1]] % 12
        let gi2 = perm[ii + 1 + perm[jj + 1]] % 12
        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0 * x0 - y0 * y0
        if (t0 < 0) n0 = 0.0
        else {
            t0 *= t0
            n0 = t0 * t0 * dot(grad3[gi0], x0, y0) // (x,y) of grad3 used for 2D gradient
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1
        if (t1 < 0) n1 = 0.0
        else {
            t1 *= t1
            n1 = t1 * t1 * dot(grad3[gi1], x1, y1)
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2
        if (t2 < 0) n2 = 0.0
        else {
            t2 *= t2
            n2 = t2 * t2 * dot(grad3[gi2], x2, y2)
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2)
    }

    return getNoise
}

function dot(g: number[], x: number, y: number) {
    return g[0] * x + g[1] * y
}