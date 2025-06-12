import Image from "next/image";
import cn from "../utils/TailwindMergeAndClsx";

interface Props {
    className?: string;
    isBlack?: boolean;
}

const IconSparkleLoader = ({ className, isBlack = false }: Props) => {
    return (
        <Image
            src="/sparkle.svg"
            alt="loader"
            width={24}
            height={24}
            className={cn(
                isBlack ? "filter invert" : "",
                className
            )}
        />
    );
};

export default IconSparkleLoader; 