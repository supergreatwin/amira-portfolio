/* Shared upload safeguard for both homepage editorial interfaces.
 * Reject new image files containing baked-in black/transparent top AND bottom
 * letterbox bands. The photo is never altered: the editor can crop the original
 * and choose the desired composition before publishing.
 */
export function detectLetterboxMargins(pixels,width,height){
  if(!pixels||width<16||height<16||pixels.length<width*height*4)return {hasLetterbox:false,top:0,bottom:0};
  const start=Math.floor(width*.05),stop=Math.ceil(width*.95);
  const step=Math.max(1,Math.floor(width/80));
  function isBand(y){
    let dark=0,total=0;
    for(let x=start;x<stop;x+=step){
      const i=(y*width+x)*4;
      const r=pixels[i],g=pixels[i+1],b=pixels[i+2],a=pixels[i+3];
      if(a<12||(a>210&&r<23&&g<23&&b<23))dark++;
      total++;
    }
    return total>0&&dark/total>=.985;
  }
  const limit=Math.floor(height*.22);
  let top=0,bottom=0;
  for(let y=0;y<limit&&isBand(y);y++)top++;
  for(let y=height-1;y>=height-limit&&isBand(y);y--)bottom++;
  return {hasLetterbox:top>=Math.ceil(height*.045)&&bottom>=Math.ceil(height*.045),top,bottom};
}
export async function validateHomepagePhoto(file){
  const allowed=['image/jpeg','image/png','image/webp'];
  if(!file||!allowed.includes(file.type)||file.size>6*1024*1024){
    throw Error('Choose an original JPG, PNG or WebP photograph under 6 MB.');
  }
  const bitmap=await createImageBitmap(file);
  try{
    const canvas=document.createElement('canvas');
    canvas.width=160;canvas.height=160;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    if(!context)throw Error('Image preview is unavailable in this browser.');
    context.drawImage(bitmap,0,0,160,160);
    const pixels=context.getImageData(0,0,160,160).data;
    if(detectLetterboxMargins(pixels,160,160).hasLetterbox){
      throw Error('This photograph has embedded black/transparent bars at its top and bottom. Crop those bars out before saving so the homepage stays edge-to-edge.');
    }
  }finally{bitmap.close?.()}
  return file;
}
