import typer
from rich.console import Console
from rich.prompt import Prompt, Confirm
import os
import subprocess
import sys
from dotenv import set_key, get_key, find_dotenv

app = typer.Typer()
console = Console()

# --- Helper Functions ---
def print_info(message):
    console.print(f"[bold blue][INFO][/bold blue] {message}")

def print_success(message):
    console.print(f"[bold green][SUCCESS][/bold green] {message}")

def print_warning(message):
    console.print(f"[bold yellow][WARNING][/bold yellow] {message}")

def print_error(message):
    console.print(f"[bold red][ERROR][/bold red] {message}", file=sys.stderr)

def get_env_path():
    """Finds or creates a .env file path."""
    env_path = find_dotenv()
    if not env_path:
        env_path = os.path.join(os.getcwd(), ".env")
        # Create the file if it doesn't exist
        with open(env_path, "w") as f:
            pass
        print_info(f"Created .env file at: {env_path}")
    return env_path

# --- CLI Commands ---

@app.command()
def init():
    """
    Initializes the project by setting up API keys and shell configuration.
    """
    console.rule("[bold]Project Initialization[/bold]")
    print_info("This wizard will guide you through setting up your environment.")

    env_path = get_env_path()

    # --- API Key Configuration ---
    console.print("\n[bold]1. API Keys[/bold]")
    
    # OpenAI Key
    existing_openai_key = get_key(env_path, "OPENAI_API_KEY") or ""
    prompt_text_openai = "Enter your OpenAI API Key"
    if existing_openai_key:
        masked_openai = f"{existing_openai_key[:4]}...{existing_openai_key[-4:]}"
        prompt_text_openai = f"Enter new OpenAI API Key (press Enter to keep {masked_openai})"
    
    openai_key_input = Prompt.ask(prompt_text_openai, password=True, show_default=False)
    final_openai_key = openai_key_input if openai_key_input else existing_openai_key

    # Gemini Key
    existing_gemini_key = get_key(env_path, "GEMINI_API_KEY") or ""
    prompt_text_gemini = "Enter your Gemini API Key"
    if existing_gemini_key:
        masked_gemini = f"{existing_gemini_key[:4]}...{existing_gemini_key[-4:]}"
        prompt_text_gemini = f"Enter new Gemini API Key (press Enter to keep {masked_gemini})"

    gemini_key_input = Prompt.ask(prompt_text_gemini, password=True, show_default=False)
    final_gemini_key = gemini_key_input if gemini_key_input else existing_gemini_key

    set_key(env_path, "OPENAI_API_KEY", final_openai_key)
    set_key(env_path, "GEMINI_API_KEY", final_gemini_key)
    print_success("API keys saved to .env file.")

    # --- Model Configuration ---
    console.print("\n[bold]2. Model Configuration[/bold]")
    preferred_provider = Prompt.ask(
        "Choose your preferred provider",
        choices=["openai", "google"],
        default=get_key(env_path, "PREFERRED_PROVIDER") or "openai"
    )
    big_model = Prompt.ask("Enter the model for 'sonnet' requests", default=get_key(env_path, "BIG_MODEL") or "gpt-4.1")
    small_model = Prompt.ask("Enter the model for 'haiku' requests", default=get_key(env_path, "SMALL_MODEL") or "gpt-4.1-mini")

    set_key(env_path, "PREFERRED_PROVIDER", preferred_provider)
    set_key(env_path, "BIG_MODEL", big_model)
    set_key(env_path, "SMALL_MODEL", small_model)
    print_success("Model configuration saved to .env file.")

    # --- Shell Configuration ---
    console.print("\n[bold]3. Shell Configuration[/bold]")
    if Confirm.ask("Add ANTHROPIC_BASE_URL to your shell startup file? (Recommended)"):
        shell = os.environ.get("SHELL", "")
        if "zsh" in shell:
            rc_file = os.path.expanduser("~/.zshrc")
        elif "bash" in shell:
            rc_file = os.path.expanduser("~/.bashrc")
        else:
            print_warning(f"Unsupported shell: {shell}. Please set ANTHROPIC_BASE_URL manually.")
            return

        url_export = "export ANTHROPIC_BASE_URL=http://localhost:8082"
        if os.path.exists(rc_file) and url_export in open(rc_file).read():
            print_info(f"ANTHROPIC_BASE_URL is already set in {rc_file}.")
        else:
            try:
                with open(rc_file, "a") as f:
                    f.write(f"\n# Added by Anthropic API Proxy\n{url_export}\n")
                print_success(f"Added ANTHROPIC_BASE_URL to {rc_file}.")
                print_info("Please restart your terminal or run 'source ~/{os.path.basename(rc_file)}' to apply changes.")
            except Exception as e:
                print_error(f"Failed to write to {rc_file}: {e}")

@app.command()
def start():
    """
    Starts the proxy server.
    """
    console.rule("[bold]Starting Server[/bold]")

    # --- Environment Setup ---
    venv_dir = ".venv"
    if not os.path.isdir(venv_dir):
        print_warning("Virtual environment not found.")
        if Confirm.ask("Create one now?"):
            try:
                subprocess.run(["python3", "-m", "venv", venv_dir], check=True)
                print_success(f"Virtual environment created at '{venv_dir}'.")
            except subprocess.CalledProcessError as e:
                print_error(f"Failed to create virtual environment: {e}")
                sys.exit(1)
        else:
            print_error("Cannot start without a virtual environment. Exiting.")
            sys.exit(1)

    # --- Install Dependencies ---
    print_info("Installing/updating dependencies...")
    try:
        pip_executable = os.path.join(venv_dir, "bin", "pip")
        subprocess.run([pip_executable, "install", "-r", "requirements.txt"], check=True, capture_output=True, text=True)
        print_success("Dependencies are up to date.")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to install dependencies: {e.stderr}")
        sys.exit(1)

    # --- Run Server ---
    print_info("Starting server with uvicorn...")
    try:
        uvicorn_executable = os.path.join(venv_dir, "bin", "uvicorn")
        subprocess.run([uvicorn_executable, "server:app", "--host", "0.0.0.0", "--port", "8082", "--reload"])
    except FileNotFoundError:
        print_error("uvicorn not found. Make sure dependencies are installed correctly.")
        sys.exit(1)
    except Exception as e:
        print_error(f"Failed to start server: {e}")
        sys.exit(1)

@app.command()
def config():
    """
    Displays the current configuration from the .env file, with sensitive keys masked.
    """
    console.rule("[bold]Current Configuration[/bold]")
    env_path = find_dotenv()
    if not env_path:
        print_warning("No .env file found. Run 'python cli.py init' to create one.")
        return

    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            try:
                key, value = line.split('=', 1)
                if "API_KEY" in key and len(value) > 8:
                    masked_value = f"{value[:4]}...{value[-4:]}"
                    console.print(f"{key}={masked_value}")
                else:
                    console.print(line)
            except ValueError:
                console.print(line)

if __name__ == "__main__":
    app()
