import pygit2
import os
from pathlib import Path
import subprocess
import sys

repo_url = "https://github.com/Julian-adv/IlluStory.git"

current_path = Path(__file__).resolve()
local_path = current_path.parent.parent.parent.parent

if os.path.exists(local_path):
    repo = pygit2.Repository(local_path)
    for remote in repo.remotes:
        if remote.name == "origin":
            remote.fetch()
            remote_main_id = repo.lookup_reference("refs/remotes/origin/main").target
            merge_result, _ = repo.merge_analysis(remote_main_id)
            if merge_result & pygit2.GIT_MERGE_ANALYSIS_UP_TO_DATE:
                print("Already up to date.")
            elif merge_result & pygit2.GIT_MERGE_ANALYSIS_FASTFORWARD:
                repo.checkout_tree(repo.get(remote_main_id))
                main_ref = repo.lookup_reference("refs/heads/main")
                main_ref.set_target(remote_main_id)
                repo.head.set_target(remote_main_id)
                print("Fast-forward pull completed.")
            else:
                print("Fast-forward is not possible. Manual merge may be required.")
else:
    pygit2.clone_repository(repo_url, local_path)
    print("Repository cloning completed.")

# Update Python packages using requirements.txt
requirements_file = os.path.join(current_path.parent, "requirements.txt")

if os.path.exists(requirements_file):
    print("Updating Python packages...")
    try:
        # Add Python\Scripts to PATH
        python_home = sys.exec_prefix
        scripts_path = os.path.join(python_home, "Scripts")
        os.environ["PATH"] = scripts_path + os.pathsep + os.environ["PATH"]
        print(os.environ["PATH"])
        subprocess.check_call(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "-r",
                requirements_file,
            ]
        )
        print("Python packages updated successfully.")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while updating packages: {e}")
else:
    print("requirements.txt file not found.")
