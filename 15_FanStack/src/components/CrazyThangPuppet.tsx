import { motion } from "motion/react";

export default function CrazyThangPuppet({ isMeltingDown }: { isMeltingDown: boolean }) {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center overflow-hidden">
      {/* Puppet Body */}
      <motion.div
        className="relative w-40 h-48 bg-[#8B4513] rounded-t-full border-4 border-black flex flex-col items-center pt-8"
        animate={isMeltingDown ? {
          y: [0, -10, 0],
          rotate: [0, -2, 2, 0],
        } : {}}
        transition={{ repeat: Infinity, duration: 0.2 }}
      >
        {/* Eyes */}
        <div className="flex gap-6 mb-4">
          <motion.div 
            className="w-8 h-8 bg-white rounded-full border-2 border-black flex items-center justify-center"
            animate={isMeltingDown ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.1 }}
          >
            <div className="w-3 h-3 bg-black rounded-full" />
          </motion.div>
          <motion.div 
            className="w-8 h-8 bg-white rounded-full border-2 border-black flex items-center justify-center"
            animate={isMeltingDown ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.1 }}
          >
            <div className="w-3 h-3 bg-black rounded-full" />
          </motion.div>
        </div>

        {/* Mouth */}
        <motion.div
          className="w-16 h-8 bg-black rounded-full"
          animate={isMeltingDown ? {
            scaleY: [1, 2, 1],
            borderRadius: ["50%", "10%", "50%"],
          } : {}}
          transition={{ repeat: Infinity, duration: 0.15 }}
        />

        {/* Catcher's Mask (Simplified) */}
        <div className="absolute top-4 w-32 h-32 border-4 border-gray-400 rounded-full opacity-50 pointer-events-none" />
      </motion.div>

      {/* Left Arm */}
      <motion.div
        className="absolute left-0 top-32 w-24 h-8 bg-[#8B4513] border-4 border-black origin-right"
        animate={isMeltingDown ? {
          rotate: [0, -60, 0, -60],
          x: [0, -10, 0],
        } : { rotate: -20 }}
        transition={{ repeat: Infinity, duration: 0.3 }}
      />

      {/* Right Arm */}
      <motion.div
        className="absolute right-0 top-32 w-24 h-8 bg-[#8B4513] border-4 border-black origin-left"
        animate={isMeltingDown ? {
          rotate: [0, 60, 0, 60],
          x: [0, 10, 0],
        } : { rotate: 20 }}
        transition={{ repeat: Infinity, duration: 0.3 }}
      />

      {/* Bullpen Sign */}
      {isMeltingDown && (
        <motion.div
          className="absolute top-0 right-0 bg-yellow-400 border-2 border-black px-2 py-1 font-bold text-xs uppercase"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          WHERE IS WILD THING?!
        </motion.div>
      )}
    </div>
  );
}
