import React from "react";
import { motion } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
};

export function StatsGrid({
    children,
    columns = 4,
}: {
    children: React.ReactNode;
    columns?: 3 | 4;
}) {
    const gridCols =
        columns === 3
            ? "grid-cols-1 md:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={`grid gap-4 sm:gap-6 ${gridCols}`}
        >
            {children}
        </motion.div>
    );
}
