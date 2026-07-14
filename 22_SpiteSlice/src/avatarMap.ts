const avatarMapProxy = new Proxy({} as Record<string, string>, {
  get: (_target, prop) => {
    if (typeof prop !== 'string') return undefined;
    const safeName = prop.toLowerCase().trim().replace(/[\s-]/g, '_');
    return `/api/persona_image/${safeName}`;
  }
});

export default avatarMapProxy;
