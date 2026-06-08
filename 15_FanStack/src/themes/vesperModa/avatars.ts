import avatarMap from "../../avatarMap";

export const getPersonaProfile = (sysUser: any) => {
    const norm = sysUser.first_name ? sysUser.first_name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    // @ts-ignore
    const targetAvatar = avatarMap[norm];

    return {
        avatarUrl: targetAvatar || '',
        name: `${sysUser.first_name} ${sysUser.last_name || ''}`.trim(),
        vibeText: sysUser.title || "Analyze. Maximize. Quantify.",
        accentColor: 'text-neon-cyan', 
        glassType: 'bg-white/5', 
        // Vesper specific additions
        department: sysUser.department || 'Unknown',
        interactions: Math.floor(Math.random() * 5000) + 1000 // Faux metric for the high-end FanStack look
    };
};
