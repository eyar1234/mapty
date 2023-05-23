'use strict';

class Workout {
  id = (Date.now() + '').slice(-10); // need to fix that later
  date = new Date();
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.duration = duration;
    this.distance = distance;
  }
  _setDescreption() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.descreption = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  _click() {
    this.clicks++;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescreption();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._setDescreption();
    this._calcSpeed();
  }
  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//application architector
////////////////////////////////////////////
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #sizeZoom = 17;

  constructor() {
    this._getPosition();
    this._getLocalStorge();
    this._toggleElevetionFileds();
    console.log(this.#workouts);

    form.addEventListener('submit', this._newWorkout.bind(this));

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('חמוד אתה צריך לאשר מיקום');
      }
    );
  }

  _loadMap(position) {
    // console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    console.log(`https://www.google.com/maps/
    ${latitude},${longitude}`);
    this.#map = L.map('map').setView(coords, this.#sizeZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // empty inputs
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => ((form.style.display = 'grid'), 1000));
  }
  _toggleElevetionFileds() {
    inputType.addEventListener('change', function () {
      inputElevation
        .closest('.form__row')
        .classList.toggle('form__row--hidden');
      inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    });
  }
  _newWorkout(e) {
    e.preventDefault();
    //get data from the form
    const duration = +inputDuration.value;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //check if data id valid
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    const allNumbers = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    // if activity running crate running object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !allNumbers(duration, distance, elevation) ||
        !allPositive(duration, distance)
      )
        return alert('חייב להיות מספר');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //if activity cycling create cycling object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !allNumbers(cadence, duration, distance) ||
        !allPositive(cadence, duration, distance)
      )
        return alert('error');

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // add new workout to workout array
    this.#workouts.push(workout);
    console.log(this.#workouts);

    // render workout on map as a marker
    this._renderWorkoutMarker(workout);

    // render workout on the list
    this._renderWorkouts(workout);

    // hide the form + cleer fields
    this._hideForm();

    // Set local storge for all workouts
    this._setLocalStorge();

    // edit workout
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.descreption} `
      )
      .openPopup();
  }
  _renderWorkouts(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.descreption}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    if (workout.type === 'running') {
      html += `
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence.toFixed(1)}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }
    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed?.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
           </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);
    this.#map.setView(workout.coords, this.#sizeZoom, {
      animate: true,
      pan: { duration: 1 },
    });
    // workout._click();
  }
  _setLocalStorge() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorge() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkouts(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
  _editForm(id) {
    // const id = +id;
    //get the correct object
    form.classList.remove('hidden');
    inputDistance.focus();
    const workout = this.#workouts.find(work => work.id === id);
    console.log(workout);

    //set data to the form from the object
    inputDuration.value = workout.duration;
    inputType.value = workout.type;
    inputDistance.value = workout.distance;
    if (workout.type === 'running') {
      inputCadence.value = workout.cadence;
    }
    if (workout.type === 'cycling') {
      inputElevation.value = workout.elevationGain;
    }

    // this._newWorkout(workout);
    // delete the object for awhil

    // render the list
  }
}

const app = new App();
// console.log(new Date());
//how to palne an application:
//--** first we cant to write a story from the user prespective in this form: as a "user" i want to"get somtiong" to "my benefit"

//example: as a user i want to click on a button and get all my banc info to get it esey.

// _editLogs(workout){

// this._showForm()

// inputDistance.value = workout.distance;
// inputDuration.value = workout.duration;

//   if(workout.type === 'running'){

//     inputType.value = workout.type
//     inputCadence.value = workout.cadence;
//     this._toggleEventField()
//   }
//   if(workout.type === 'cycling'){
//      inputType.value = workout.type
//     inputElevation.value = workout.elevationGain;
//     this._toggleEventField()

//   }
