Plan:

Process image on client side:
hope to extract eye color, skin color, hair color, etc.

-Scrape a mc skins website for training data

-Train a stable diffusion model on Huggingface or something similar (I think there is a pay per use options which if i dont have tons of users is probably the way to go)

- Send the extracted data + anything users add (like what type of shirt etc.) as a paragraph to huggingface model and wait for resposne

-Current most pressing:
Make a model that isnt horrible

- Eventually make sure everything is secure (i.e only authenticated users can call hugging face. Maybe will need to add something to firebase to do this)
