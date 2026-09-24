// Copyright (c) 2026 QRslice. All rights reserved.
export interface Button{ id:string; title:string }
export function routeKeyword(body:string, ctx:{restaurantSlug?:string}): {reply:string,buttons?:Button[]}|null{
  const t=(body||"").trim().toUpperCase();
  if(t==="MENU") return {reply:`Hi! Browse menu: https://${ctx.restaurantSlug||"qrslice"}.qrslice.com/menu`, buttons:[{id:"menu",title:"View Menu"}]};
  if(t==="HELP") return {reply:"Need help? Reply SUPPORT or call +91 98765 43210", buttons:[{id:"support",title:"Chat Support"}]};
  const m=t.match(/^TRACK\s+(.+)/); if(m) return {reply:`Order ${m[1].trim()}: checking… (TRACK lookup wired in Task 5)`};
  return null;
}
