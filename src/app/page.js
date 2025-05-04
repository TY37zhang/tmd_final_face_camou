import ClientWrapper from "../components/ClientWrapper";

export default function Home() {
    return (
        <main className="min-h-screen w-full flex flex-col md:flex-row bg-black text-[#c3d1c3] font-mono">
            {/* Left Column */}
            <section className="flex-1 flex flex-col justify-between p-8 md:p-16">
                <div>
                    <div className="cyberpunk text-[7vw] leading-none mb-8 select-none">
                        Digital
                        <br />
                        Camo
                    </div>
                    <div className="uppercase text-xs tracking-widest mb-8 max-w-xs">
                        Hiding in Plain Sight
                    </div>
                    <div className="mt-12 max-w-xl text-base text-[#c3d1c3]">
                        <p>
                            <strong>How it works:</strong> This algorithm uses
                            real-time face detection and landmark recognition to
                            identify key facial features such as the eyes, nose,
                            and mouth. It then applies digital distortion to
                            these regions using p5.js, creating a camouflaged
                            effect that obscures your digital identity while
                            preserving the overall structure of your face.
                        </p>
                        <p className="mt-4">
                            <strong>Purpose:</strong> The goal is to explore new
                            forms of digital privacy and creative
                            self-expression. By distorting facial features in
                            real time, this project demonstrates how technology
                            can be used to both reveal and conceal identity in
                            the age of ubiquitous cameras and AI.
                        </p>
                    </div>
                </div>
            </section>

            {/* Right Column: FaceDistortion Camera */}
            <section className="flex items-center justify-center flex-1 p-8 md:p-16">
                <div className="w-[640px] h-[480px]">
                    <ClientWrapper />
                </div>
            </section>
        </main>
    );
}
