'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;






// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000

var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})


var HELP_TEXT = `
I will respond to the following messages 😎:
\`help\` - to see this message.
\`hi\` - to demonstrate a conversation that tracks state.
\`thanks\` - to demonstrate a simple response.
\`<type-any-other-text>\` - to demonstrate a random emoticon response, some of the time :wink:.
\`attachment\` - to see a Slack attachment message.
`

//*********************************************
// Setup different handlers for messages
//*********************************************

// response to the user typing "help"
function getReactionGif(msg){
	// msg.say("Fetching Reaction Gifs...");
	var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4 && xhr.status == 200){
            // console.log(xhr.responseText);
			var jsonResponse = JSON.parse(xhr.responseText);
			// console.log(jsonResponse);
			// msg.say(jsonResponse.data.image_url);

			msg.say({
		      text: '',
		      attachments: [{
		   	 text: '',
		   	 title: '',
			 //  	 image_url: jsonResponse.data.image_url,
		   	 image_url: jsonResponse.data.fixed_height_downsampled_url,
		   	 title_link: '',
		   	 color: ''
		      }]
		    })

			// msg.say(jsonResponse.data.url);

        }
    }
    xhr.open("GET", "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=reaction", true);
    xhr.send();

}
// slapp.event('file_shared', (msg) => {
//
// 	msg.say(":thumbsup:");
// 	getReactionGif(msg);
//
// })

// add a smile reaction by the bot for any message reacted to
slapp.event('file_shared', (msg) => {
	msg.say(":thumbsup:");
	// let token = msg.meta.bot_token
	// let id = msg.body.event.item.ts
	// let channel = msg.body.event.item.channel
	// slapp.client.reactions.add({token, 'smile', id, channel}, (err) => {
	// 	if (err) console.log('Error adding reaction', err)
	// })
})


// slapp.event('file_share', (msg) => {
slapp.message('file_share', ['mention', 'direct_message'], (msg) => {
	msg.say(":thumbsup: :cool:");
  // let token = msg.meta.bot_token
  // let id = msg.body.event.item.ts
  // let channel = msg.body.event.item.channel
  // slapp.client.reactions.add({token, 'smile', id, channel}, (err) => {
  //   if (err) console.log('Error adding reaction', err)
  // })
})

slapp.message('help', ['mention', 'direct_message'], (msg) => {

	msg.say(HELP_TEXT);
})

// Catch all mentions of the bot
slapp.message('', ['mention'], (msg) => {
  // respond only 40% of the time

	// console.log("detected me");
	// msg.say("What?");
	getReactionGif(msg);
})

// slapp.message('Robert', ['mention', 'direct_message'], (msg) => {
//   msg.say('What a dick!')
// })

// slapp.message('jens', ['mention', 'direct_message'], (msg) => {
//   msg.say('What a dick!')
// })

slapp.message(/^(Ralf|Jens|Robert|Frank|Isa|Jan|Daniel)/i, ['mention', 'direct_message'], (msg) => {
	// var text = (msg.body.event && msg.body.event.text) || '';
	msg.say([
      '🚀',
      '💩',
      ':+1: That\'s my man',
      'Best colleague :sun_with_face: :full_moon_with_face:'
    ])
})

// "Conversation" flow that tracks state - kicks off when user says hi, hello or hey
slapp
  .message('^(hi|hello|hey)$', ['direct_mention', 'direct_message'], (msg, text) => {
    msg
      .say(`${text}, how are you?`)
      // sends next event from user to this route, passing along state
      .route('how-are-you', { greeting: text })
  })
  .route('how-are-you', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say("Whoops, I'm still waiting to hear how you're doing.")
        .say('How are you?')
        .route('how-are-you', state)
    }

    // add their response to state
    state.status = text

    msg
      .say(`Ok then. What's your favorite color?`)
      .route('color', state)
  })
  .route('color', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say("I'm eagerly awaiting to hear your favorite color.")
        .route('color', state)
    }

    // add their response to state
    state.color = text

    msg
      .say('Thanks for sharing.')
      .say(`Here's what you've told me so far: \`\`\`${JSON.stringify(state)}\`\`\``)
    // At this point, since we don't route anywhere, the "conversation" is over
  })

// Can use a regex as well
slapp.message(/^(thanks|thank you)/i, ['mention', 'direct_message'], (msg) => {
  // You can provide a list of responses, and a random one will be chosen
  // You can also include slack emoji in your responses
  msg.say([
    "You're welcome :smile:",
    'You bet',
    ':+1: Of course',
    'Anytime :sun_with_face: :full_moon_with_face:'
  ])
})

// demonstrate returning an attachment...
slapp.message('attachment', ['mention', 'direct_message'], (msg) => {
  msg.say({
    text: 'Check out this amazing attachment! :confetti_ball: ',
    attachments: [{
      text: 'Slapp is a robust open source library that sits on top of the Slack APIs',
      title: 'Slapp Library - Open Source',
      image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
      title_link: 'https://beepboophq.com/',
      color: '#7CD197'
    }]
  })
})



// Catch-all for any other responses not handled above
slapp.message('.*', ['direct_message','direct_mention'], (msg) => {
  // respond only 40% of the time

	if (Math.random() < 0.4) {
		msg.say([':wave:', ':pray:', ':raised_hands:', ':kissing_heart:',':monkey:'])
	}else{
		// getReactionGif(msg);
	}
})



// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }
  console.log(`Listening on port ${port}`)
})
