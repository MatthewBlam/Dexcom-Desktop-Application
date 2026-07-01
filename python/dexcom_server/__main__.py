import argparse
import asyncio

from .main import main

parser = argparse.ArgumentParser()
parser.add_argument("--secret", default=None)
args = parser.parse_args()

asyncio.run(main(secret=args.secret))
