import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    AudioConfig,
    BackgroundAudioPlayer,
    BuiltinAudioClip,
    JobContext,
    TurnHandlingOptions,
    cli,
    inference,
    room_io,
)
from livekit.agents.beta.tools import EndCallTool
from livekit.plugins import ai_coustics

logger = logging.getLogger("agent-AbbieCSR")

load_dotenv(".env.local")

PROMPT_DIR = Path(__file__).resolve().parent.parent / "prompts"
ABBIE_INSTRUCTIONS = "\n".join(
    path.read_text(encoding="utf-8").rstrip("\n")
    for path in sorted(PROMPT_DIR.glob("*.txt"))
)


class DefaultAgent(Agent):
    def __init__(self) -> None:
        end_call_tool = EndCallTool(
            extra_description=(
                "Only end the call once the customer confirms they are done or it is clear "
                "the next step has been handed off."
            ),
            end_instructions=(
                "Before ending, summarize the resolution or next action in one or two sentences, "
                "then say goodbye naturally."
            ),
            delete_room=False,
            ignore_on_enter=True,
        )

        super().__init__(
            instructions=ABBIE_INSTRUCTIONS,
            tools=end_call_tool.tools,
        )

    async def on_enter(self):
        await self.session.say(
            "Hi, thanks for calling ABI Tech. This is Abbie. Who am I speaking with?",
            allow_interruptions=True,
        )


server = AgentServer()


@server.rtc_session(agent_name="AbbieCSR")
async def entrypoint(ctx: JobContext):
    session = AgentSession(
        stt=inference.STT(model="deepgram/nova-3", language="multi"),
        stt_context_options={"keyterm_detection": {"enabled": True}},
        llm=inference.LLM(
            model="google/gemma-4-31b-it",
        ),
        tts=inference.TTS(
            model="cartesia/sonic-3.6",
            voice=os.environ["CARTESIA_VOICE_ID"],
            language="en-US",
        ),
        expressive=True,
        turn_handling=TurnHandlingOptions(
            turn_detection=inference.TurnDetector(),
            preemptive_generation={"enabled": True},
        ),
        vad=inference.VAD(),
    )

    await session.start(
        agent=DefaultAgent(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=ai_coustics.audio_enhancement(
                    model=ai_coustics.EnhancerModel.QUAIL_VF_L,
                ),
            ),
        ),
    )

    background_audio = BackgroundAudioPlayer(
        ambient_sound=AudioConfig(BuiltinAudioClip.OFFICE_AMBIENCE, volume=1.0),
    )

    await background_audio.start(room=ctx.room, agent_session=session)


if __name__ == "__main__":
    cli.run_app(server)
