  
export function cosineSimilarity(v1, v2) {
    console.log(`v1 ${typeof (v1)}`)
    console.log(`v2 ${typeof (v2)}`)
    if (v1.length !== v2.length) {
      return -1;
    }
    let dotProduct = 0;
    let v1_mag = 0;
    let v2_mag = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      v1_mag += v1[i] ** 2;
      v2_mag += v2[i] ** 2;
    }
    return dotProduct / (Math.sqrt(v1_mag) * Math.sqrt(v2_mag));
  }