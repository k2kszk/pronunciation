//pronunciation/app.js
//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

function startRecording() {
	console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: true, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

	recordButton.disabled = true;
	stopButton.disabled = false;

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext();


		/*  assign to gumStream for later use  */
		gumStream = stream;
		
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})

		//start the recording process
		rec.record()

		console.log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
    	recordButton.disabled = false;
    	stopButton.disabled = true;
    	pauseButton.disabled = true
	});
}

function pauseRecording(){
	console.log("pauseButton clicked rec.recording=",rec.recording );
	if (rec.recording){
		//pause
		rec.stop();
		pauseButton.innerHTML="Resume";
	}else{
		//resume
		rec.record()
		pauseButton.innerHTML="Pause";

	}
}

function stopRecording() {
	console.log("stopButton clicked");

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;

	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {
	
	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString();

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;
	
	//upload link
	var upload = document.createElement('BUTTON');
	upload.href="#";
	upload.innerHTML = "録音をアップロード";
	upload.style.fontFamily = "'M PLUS Rounded 1c', sans-serif";
	upload.className = "btn btn-primary btn-lg";

		upload.addEventListener("click", function(event){
		  var xhr=new XMLHttpRequest();
		  xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				var prescore = JSON.parse(xhr.responseText);
				console.log(typeof prescore)
				console.log(prescore)

				var word = prescore.results.elements

				var body = document.getElementsByTagName("body")[0];
				var tbl = document.createElement("table");
				var tblBody = document.createElement("tbody");
				//var word = score.data.read_sentence.rec_paper.read_chapter.sentence.word;

				word.forEach( function(value) {
					var row = document.createElement("tr");
					var cell1 = document.createElement("td");
					var cellText1 = document.createTextNode(value.transcription);
					var cell2 = document.createElement("td");
					var cellText2 = document.createTextNode(value.composition[0].pron);
					cell1.appendChild(cellText1);
					cell2.appendChild(cellText2);

					row.appendChild(cell1);
					row.appendChild(cell2);

					tblBody.appendChild(row);
				});
				tbl.appendChild(tblBody);
				body.appendChild(tbl);
				tbl.setAttribute("class", "table table-striped");

				var phone = prescore.results.phones

				var body = document.getElementsByTagName("body")[0];
				var tbl = document.createElement("table");
				var tblBody = document.createElement("tbody");
				//var word = score.data.read_sentence.rec_paper.read_chapter.sentence.word;

				phone.forEach(function(value) {
					var row = document.createElement("tr");
					var cell1 = document.createElement("td");
					var cellText1 = document.createTextNode(value[0]);
					var cell2 = document.createElement("td");
					var cellText2 = document.createTextNode(Math.round(value[1]*100) + "点");
					cell1.appendChild(cellText1);
					cell2.appendChild(cellText2);

					row.appendChild(cell1);
					row.appendChild(cell2);

					tblBody.appendChild(row);
				});
				tbl.appendChild(tblBody);
				body.appendChild(tbl);
				tbl.setAttribute("class", "table table-striped");


			}
		}
		  var fd=new FormData();
		  fd.append("audio_data",blob, filename);
		  const text = document.getElementById('text').value;
		  fd.append('text', text);
		  xhr.open("POST","/",true);
		  xhr.send(fd);
	})
	li.appendChild(document.createTextNode (" "))//add a space in between
	li.appendChild(upload)//add the upload link to li

	//add the li element to the ol
	recordingsList.appendChild(li);
}