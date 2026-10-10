class SharakahCapture extends AudioWorkletProcessor {
 constructor(){super();this.samples=new Float32Array(1024);this.offset=0;}
 process(inputs){const channel=inputs[0]?.[0];if(channel){let i=0;while(i<channel.length){const count=Math.min(channel.length-i,this.samples.length-this.offset);this.samples.set(channel.subarray(i,i+count),this.offset);i+=count;this.offset+=count;if(this.offset===this.samples.length){this.port.postMessage(this.samples.slice());this.offset=0}}}return true;}
}
registerProcessor('sharakah-capture',SharakahCapture);
