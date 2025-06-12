"use client";
import { useState } from "react";
import DottedFace from "./components/DottedFace";
import SimliElevenlabs from "./SimliElevenlabs";

interface avatarSettings {
    elevenlabs_agentid: string | undefined;
    simli_faceid: string | undefined;
}

// Get avatar settings from environment variables
const avatar: avatarSettings = {
    elevenlabs_agentid: process.env.ELEVENLABS_AGENT_ID,
    simli_faceid: process.env.SIMLI_FACE_ID,
};

export default function AvatarPage() {
    const [showDottedFace, setShowDottedFace] = useState(true);

    const onStart = () => {
        console.log("Setting setshowDottedface to false...");
        setShowDottedFace(false);
    };

    const onClose = () => {
        console.log("Setting setshowDottedface to true...");
        setShowDottedFace(true);
    };

    return (
        <div className="flex flex-col items-center">
            <h1 className="text-2xl font-semibold mb-8">AI Avatar Interaction</h1>
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg shadow-sm flex flex-col items-center">
                {showDottedFace && <DottedFace />}
                <SimliElevenlabs
                    agentId={avatar.elevenlabs_agentid}
                    simli_faceid={avatar.simli_faceid}
                    onStart={onStart}
                    onClose={onClose}
                    showDottedFace={showDottedFace}
                />
            </div>
        </div>
    );
} 