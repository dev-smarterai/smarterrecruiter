import Image from 'next/image';

export default function DottedFace(props: any) {
    return (
        <div className="flex justify-center items-center">
            <Image
                src="/dottedface.gif"
                alt="loading..."
                width={350}
                height={350}
                className="filter invert"
            />
        </div>
    );
} 