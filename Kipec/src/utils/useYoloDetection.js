import * as ort from 'onnxruntime-web';

export const runYoloDetection = async (imageBitmap, modelUrl = '/models/best.onnx') => {
  const session = await ort.InferenceSession.create(modelUrl);
  const tensor = preprocessImage(imageBitmap);
  const feeds = { images: tensor };
  const results = await session.run(feeds);
  return postprocess(results);
};

function preprocessImage(imageBitmap) {
  const canvas = new OffscreenCanvas(640, 640);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0, 640, 640);

  const imageData = ctx.getImageData(0, 0, 640, 640);
  const { data } = imageData;
  const input = new Float32Array(640 * 640 * 3);
  for (let i = 0; i < 640 * 640; i++) {
    input[i] = data[i * 4] / 255;
    input[i + 640 * 640] = data[i * 4 + 1] / 255;
    input[i + 2 * 640 * 640] = data[i * 4 + 2] / 255;
  }

  return new ort.Tensor('float32', input, [1, 3, 640, 640]);
}

function calculateIoU(box1, box2) {
  const xA = Math.max(box1.x, box2.x);
  const yA = Math.max(box1.y, box2.y);
  const xB = Math.min(box1.x + box1.w, box2.x + box2.w);
  const yB = Math.min(box1.y + box1.h, box2.y + box2.h);

  const intersectionArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);

  const box1Area = box1.w * box1.h;
  const box2Area = box2.w * box2.h;

  const iou = intersectionArea / (box1Area + box2Area - intersectionArea);
  return iou;
}

function applyNMS(detections, iouThreshold) {
  if (!detections.length) {
    return [];
  }

  detections.sort((a, b) => b.score - a.score);

  const keptDetections = [];
  const suppressed = new Array(detections.length).fill(false);

  for (let i = 0; i < detections.length; i++) {
    if (suppressed[i]) {
      continue;
    }
    keptDetections.push(detections[i]);
    for (let j = i + 1; j < detections.length; j++) {
      if (suppressed[j]) {
        continue;
      }
      const iou = calculateIoU(detections[i], detections[j]);
      if (iou > iouThreshold) {
        suppressed[j] = true;
      }
    }
  }
  return keptDetections;
}

function postprocess(results) {
  console.log('Raw model output (results object):', results);
  const outputTensor = results["output0"]; 

  if (!outputTensor || !outputTensor.data || !outputTensor.dims) {
    console.error("Output tensor 'output0' is invalid or missing data/dims.", outputTensor);
    return [];
  }

  const outputData = outputTensor.data; 
  const outputDims = outputTensor.dims; 

  console.log("Output tensor 'output0' details:", outputTensor);
  console.log("Output tensor 'output0' dimensions (shape):", outputDims); 

  const detections = [];
  const confidenceThreshold = 0.6; 
  const modelInputWidth = 640;     
  const modelInputHeight = 640;    
  const nmsIouThreshold = 0.45;    
  const appHatClassId = 1;

  if (outputDims.length !== 3 || outputDims[0] !== 1) {
    console.error(
      "Unexpected output tensor dimensions:", outputDims,
      "Expected shape like [1, elements_per_proposal, num_proposals]."
    );
    return [];
  }

  const elementsPerProposalDim = outputDims[1]; 
  const numProposals = outputDims[2];       

  const expectedElementsPerProposal = 5;
  if (elementsPerProposalDim !== expectedElementsPerProposal) {
    console.warn(
      `Expected ${expectedElementsPerProposal} elements per proposal (4 bbox + 1 class score/logit), but got ${elementsPerProposalDim}.` +
      `The parsing logic below might be incorrect for this model's output structure.`
    );
    return []; 
  }

  for (let p = 0; p < numProposals; p++) {

    const x_center_norm = outputData[0 * numProposals + p];
    const y_center_norm = outputData[1 * numProposals + p];
    const width_norm = outputData[2 * numProposals + p];
    const height_norm = outputData[3 * numProposals + p];

    const score_logit = outputData[4 * numProposals + p];

    const probability = 1 / (1 + Math.exp(-score_logit));
    
    if (probability > confidenceThreshold) {
      const box_x_center_px = x_center_norm * modelInputWidth;
      const box_y_center_px = y_center_norm * modelInputHeight;
      const box_width_px = width_norm * modelInputWidth;
      const box_height_px = height_norm * modelInputHeight;

      const x_min_px = box_x_center_px - box_width_px / 2;
      const y_min_px = box_y_center_px - box_height_px / 2;
      
      detections.push({
        x: x_min_px,       
        y: y_min_px,       
        w: box_width_px,   
        h: box_height_px,  
        classId: appHatClassId,
        score: probability, 
      });
    }
  }
  console.log('Processed Detections (before NMS):', detections.length, detections);
  
  const finalDetections = applyNMS(detections, nmsIouThreshold);
  
  console.log('Processed Detections (after NMS):', finalDetections.length, finalDetections);

  return finalDetections;
}
