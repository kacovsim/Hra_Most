// Controller for generating info banners and infobanner definition

// first smaller window of info banner
AFRAME.registerComponent('hover-popup', {
  schema: {
    text: { type: 'string', default: 'Info' },
    detailText: { type: 'string', default: 'Detail Info' },
    imageCodes: { type: 'array'},
    width: { type: 'number', default: 1.2 },
    height: { type: 'number', default: 0.8 },
    yOffset: { type: 'number', default: 1.5 },
    detailMoveOffset: { type: 'number', default: -1.5 },
    detailTextColor: {type: 'string'},
    detailBackgroundColor: {type: 'string'}
  },

  init: function () {
    const el = this.el;
    const data = this.data;

    this.isPopupOpen = false;
    this.isInited = false;
    const animation_duration = 500;

    this.popup = null;


    const initializePopupEntities = () => {
      console.log("Initializing popup...");

      this.popup = document.createElement('a-entity');
      const popup_plane = document.createElement('a-entity');
      const popup_text = document.createElement('a-entity');
      this.popup_MoreInfo_plane = document.createElement('a-entity'); // this kvoli vypinaniu a zapinaniu classy
      const popup_MoreInfo_text = document.createElement('a-entity');
      this.popup_X_plane = document.createElement('a-entity');

      // popup starting position 
      this.popup.setAttribute('position', `0 ${data.yOffset - 0.4} 0`); // start slightly below
      this.popup.setAttribute('visible', false);
      this.popup.addEventListener('animationcomplete__disappear', () => { // turn off after disapear animation
        this.popup.setAttribute('visible', false);
        this.isPopupOpen = false;
      });
      this.popup.addEventListener('animationcomplete__appear', () => { // turn on after appear animation
        this.popup_MoreInfo_plane.classList.add('clickable');
        this.popup_X_plane.classList.add('clickable');
      });

      // background plane 
      popup_plane.setAttribute('geometry', {
        primitive: 'plane',
        width: data.width,
        height: data.height
      });
      popup_plane.setAttribute('material', {
        color: '#242323',
        transparent: false,
        side: 'double'
      });
      // main popup text
      popup_text.setAttribute('text', {
        value: data.text,
        font: 'static/fonts/RobotoFlex-msdf.json', 
        negate: false,
        align: 'center',
        width: data.width,
        color: '#FFF',
        wrapCount: 20,
      });
      popup_text.setAttribute('position', '0 0.2 0.01');
      
      
      // "Více informací" button
      this.popup_MoreInfo_plane.setAttribute('geometry', {
        primitive: 'plane',
        width: data.width * 0.9,
        height: data.height * 0.4
      });
      this.popup_MoreInfo_plane.setAttribute('material', {
        color: '#5c5959',
        transparent: false
      });
      this.popup_MoreInfo_plane.setAttribute('position', '0 -0.2 0.01');
      this.popup_MoreInfo_plane.setAttribute('display-detail', {imageCodes: data.imageCodes, text: data.detailText, targetPos: this.el.object3D.position, textColor: data.detailTextColor, backgroundColor: data.detailBackgroundColor,});
      this.popup_MoreInfo_plane.setAttribute('ui-button-color-animation', {color_default: "#5c5959", color_click: "#002b7c", color_hover: "#205bdb"});

      // "Více informací" button text
      popup_MoreInfo_text.setAttribute('text', {
          value: 'Více informací',
          font: 'static/fonts/RobotoFlex-msdf.json', 
          negate: false,
          align: 'center',
          color: '#FFF',
          width: data.width * 2
      });
      popup_MoreInfo_text.setAttribute('position', '0 0 0.01');
      
      // X button
      this.popup_X_plane.setAttribute('popup-x-button', {});
      this.popup_X_plane.setAttribute('position', '0 -0.55 0.01');

      
      this.popup_X_plane.addEventListener('click', (evt) => {
        console.log("Clicked X");
        hidePopup();
      });

      // append childrent in tree popup => planes[] => text
      el.appendChild(this.popup);
        this.popup.appendChild(popup_plane);
          popup_plane.appendChild(popup_text);
        this.popup.appendChild(this.popup_MoreInfo_plane);
          this.popup_MoreInfo_plane.appendChild(popup_MoreInfo_text);
        this.popup.appendChild(this.popup_X_plane);

        this.isInited = true;
    }
    

    // Appear animation
    const showPopup = () => {
      if (this.isPopupOpen) {
        console.log("Popup already open");
        return;
      }
      
      console.log("Displaying pop-up!");

      if (!this.isInited) {
        // first time opening popup; lazy initialize the popup 
        initializePopupEntities();
      }

      faceCameraOnce(this.popup);
      this.popup.removeAttribute('animation__appear');
      this.popup.setAttribute('animation__appear', {
        property: 'position',
        from: `0 ${data.yOffset - 0.4} 0`,
        to: `0 ${data.yOffset} 0`,
        dur: animation_duration,
        easing: 'easeOutQuad'
      });

      this.popup.setAttribute('visible', true);
      this.isPopupOpen = true;
    };

    // Disappear animation
    const hidePopup = () => {
      if(!this.isPopupOpen) return;
      console.log("Hiding pop-up!");
      this.popup.removeAttribute('animation__disappear');
      this.popup.setAttribute('animation__disappear', {
        property: 'position',
        to: `0 ${data.yOffset - 0.4} 0`,
        dur: animation_duration,
        easing: 'easeInQuad'
      });
      this.popup_MoreInfo_plane.classList.remove('clickable');
      this.popup_X_plane.classList.remove('clickable');
    };

    el.addEventListener('click', (evt) => {
      console.log('clicked on parent');
      showPopup();
    });
    
  }
});


// second larger window of info banner
AFRAME.registerComponent('display-detail', {
   schema: {
    text: { type: 'string', default: 'Detail Info Placeholder' },
    yOffset: { type: 'number', default: 0.5 },
    moveOffset: { type: 'number', default: -2 },
    imageCodes: { type: 'array'},
    targetPos: { type: 'vec3' },
    textColor: {type: 'string', default: '#ffffff'},
    backgroundColor: {type: 'string', default: '#1a1a1a'}
  },

  init: function () {
    const el = this.el;
    const data = this.data;
    const animationDuration = 1500;
    const enhanceAnimationDuration = 500;
    const enhanceYOffset = 1;

    this.detail = null
    this.imageSrcCollection = null;
    this.photoIndex = 0;
    const text_offset = 0.3

    this.isDetailOpen = false;
    this.isPhotoEnhanced = false;
    this.isInited = false;


    console.log(data.targetPos);
    console.log(data.imageCodes);

    // photo iteration
    const nextPhoto = () => {
      this.photoIndex = (this.photoIndex + 1) % this.imageSrcCollection.length;
      this.img.setAttribute('src', this.imageSrcCollection[this.photoIndex]);
    }
    const prevPhoto = () => {
      this.photoIndex = (this.photoIndex - 1 + this.imageSrcCollection.length) % this.imageSrcCollection.length;
      this.img.setAttribute('src', this.imageSrcCollection[this.photoIndex]);
    }

    // remove clickable class when hiding
    const removeClasses = () => {
      this.popup_X_plane.classList.remove('clickable');
      if (data.imageCodes.length) {
        this.img.classList.remove('clickable');
        this.leftAr.classList.remove('clickable');
        this.rightAr.classList.remove('clickable');
        this.audiob.classList.remove('clickable');
      }
    }

    // remove clickable classes when photo enhanced
    const removeClassesForEnhance = () => {
      this.popup_X_plane.classList.remove('clickable');
      if (data.imageCodes.length) {
        this.img.classList.remove('clickable');
        this.audiob.classList.remove('clickable');
      }
    }
    // add classes when showing this 
    const addClasses = () => {
      this.popup_X_plane.classList.add('clickable');
      if (data.imageCodes.length) {
        this.img.classList.add('clickable');
        this.leftAr.classList.add('clickable');
        this.rightAr.classList.add('clickable');
        this.audiob.classList.add('clickable');
      }
    }
    // return clickable classes when returning from photo enhanced
    const addClassesForEnhance = () => {
      this.popup_X_plane.classList.add('clickable');
      if (data.imageCodes.length) {
        this.img.classList.add('clickable');
        this.audiob.classList.add('clickable');
      }
    }

    const turnOffDetailForEnhance = () => {
      if (this.isPhotoEnhanced) {
        console.log("Already turn off!");
        return;
      }
      this.plane.setAttribute('visible', 'false');
      this.popup_X_plane.setAttribute('visible', 'false');
      this.audiob.setAttribute('visible', 'false');
    }
    const turnOnDetailForEnhance = () => {
      if (!this.isPhotoEnhanced) {
        console.log("Already turn on!");
        return;
      }
      this.plane.setAttribute('visible', 'true');
      this.popup_X_plane.setAttribute('visible', 'true');
      this.audiob.setAttribute('visible', 'true');
    }

    const initializeDetail = async () => {
      console.log("initializing detail...");

      this.detail = document.createElement('a-entity');
      this.plane = document.createElement('a-entity');
      this.text = document.createElement('a-entity');
      this.popup_X_plane = document.createElement('a-entity');

      // image
      // IF there are any image codes - fetch images
      if (data.imageCodes.length) {
        console.log("Creating images...");
        
        this.img = document.createElement('a-image');
        this.rightAr = document.createElement('a-entity');
        this.leftAr = document.createElement('a-entity');
        this.en_X_plane = document.createElement('a-entity');
        
        this.imageSrcCollection = await Promise.all(
          data.imageCodes.map(code => fetchImage(code))
        );

        console.log(this.imageSrcCollection[0]);

        this.img.setAttribute('height', 0.844);
        this.img.setAttribute('width', 1.5);
        this.img.setAttribute('position', '0 0.844 0.01');
        let imgPos = this.img.getAttribute("position");
        this.img.setAttribute('src', this.imageSrcCollection[0]);
        this.img.setAttribute('ui-button-color-animation', {
          color_default: "#FFF", 
          color_click: "#656668", 
          color_hover: "#a3a3a3"
        });
        this.img.addEventListener('click', (evt) => {
          // Enhance Photo
          if (this.isPhotoEnhanced) {
            console.log("Already enhanced!");
            return;
          }

          removeClassesForEnhance();
          this.en_X_plane.setAttribute('visible', true);
          this.en_X_plane.classList.add('clickable');
          turnOffDetailForEnhance();

          // img enlarge and move to middle
          imgPos = this.img.getAttribute("position");
          this.en_X_plane.removeAttribute('animation__XEnhancePosition');
          this.en_X_plane.setAttribute('animation__XEnhancePosition', {
            property: 'position',
            from: `${imgPos.x} ${imgPos.y} ${imgPos.z}`,
            to: `${imgPos.x} ${imgPos.y - enhanceYOffset - 1.2} ${imgPos.z + 0.02}`,
            dur: enhanceAnimationDuration,
            easing: 'easeOutQuad'
          });          
          this.img.removeAttribute('animation__imgEnhancePosition');
          this.img.setAttribute('animation__imgEnhancePosition', {
            property: 'position',
            from: `${imgPos.x} ${imgPos.y} ${imgPos.z}`,
            to: `${imgPos.x} ${imgPos.y - enhanceYOffset} ${imgPos.z + 0.03}`,
            dur: enhanceAnimationDuration,
            easing: 'easeOutQuad'
          });
          this.img.removeAttribute('animation__imgEnhanceScale');
          this.img.setAttribute('animation__imgEnhanceScale', {
            property: 'scale',
            from: `1 1 1`,
            to: `2 2 1`,
            dur: enhanceAnimationDuration,
            easing: 'easeOutQuad'
          });

          // arrows move to middle
          rightArPos = this.rightAr.getAttribute("position");
          leftArPos = this.leftAr.getAttribute("position");
          this.rightAr.removeAttribute('animation__imgEnhancePosition');
          this.rightAr.setAttribute('animation__imgEnhancePosition', {
            property: 'position',
            from: `${rightArPos.x} ${rightArPos.y} ${rightArPos.z}`,
            to: `${rightArPos.x + 0.725} ${rightArPos.y - enhanceYOffset} ${rightArPos.z + 0.03}`,
            dur: enhanceAnimationDuration,
            easing: 'easeOutQuad'
          });
          this.leftAr.removeAttribute('animation__imgEnhancePosition');
          this.leftAr.setAttribute('animation__imgEnhancePosition', {
            property: 'position',
            from: `${leftArPos.x} ${leftArPos.y} ${leftArPos.z}`,
            to: `${leftArPos.x - 0.725} ${leftArPos.y - enhanceYOffset} ${leftArPos.z + 0.03}`,
            dur: enhanceAnimationDuration,
            easing: 'easeOutQuad'
          });

          this.isPhotoEnhanced = true;
        });

        // right arrow
        this.rightAr.setAttribute('geometry', {
          primitive: 'triangle',
          vertexC: '0 -0.2 0',
          vertexA: '0.13 0 0',
          vertexB: '0 0.2 0'
        });
        this.rightAr.setAttribute('position', '0.82 0.844 0.01');
        this.rightAr.setAttribute('material', 'color: #5c5959; shader: flat');
        this.rightAr.setAttribute('ui-button-color-animation', {
          color_default: "#5c5959", 
          color_click: "#002b7c", 
          color_hover: "#205bdb"
        });
        this.rightAr.addEventListener('click', (evt) => {
          console.log("NEXT PHOTO");
          nextPhoto();
        });

        // left arrow
        this.leftAr.setAttribute('geometry', {
          primitive: 'triangle',
          vertexC: '0 -0.2 0',
          vertexA: '0 0.2 0',
          vertexB: '-0.13 0 0'
        });
        this.leftAr.setAttribute('position', '-0.82 0.844 0.01');
        this.leftAr.setAttribute('material', 'color: #5c5959; shader: flat');
        this.leftAr.setAttribute('ui-button-color-animation', {
          color_default: "#5c5959", 
          color_click: "#002b7c", 
          color_hover: "#205bdb"
        });
        this.leftAr.addEventListener('click', (evt) => {
          console.log("PREV PHOTO");
          prevPhoto();
        });

        // enhanced photo X button
        this.en_X_plane.setAttribute('popup-x-button', {});
        this.en_X_plane.setAttribute('position', '0 0.844 0.02');
        this.en_X_plane.setAttribute('id', 'XKO');
        this.en_X_plane.setAttribute('visible', false);
        this.en_X_plane.addEventListener('click', (evt) => {
          // Dehance photo
          if (!this.isPhotoEnhanced) {
            console.log("Photo already dehanced!");
            return;
          }

          imgPos = this.img.getAttribute("position");
          this.en_X_plane.removeAttribute('animation__XDehancePosition');
          this.en_X_plane.setAttribute('animation__XDehancePosition', {
            property: 'position',
            from: `${imgPos.x} ${imgPos.y} ${imgPos.z }`,
            to: `${imgPos.x} ${imgPos.y + enhanceYOffset} ${imgPos.z - 0.02}`,
            dur: enhanceAnimationDuration,
            easing: 'easeOutQuad'
          });          
          this.img.removeAttribute('animation__imgDehancePosition');
          this.img.setAttribute('animation__imgDehancePosition', {
            property: 'position',
            from: `${imgPos.x} ${imgPos.y} ${imgPos.z}`,
            to: `${imgPos.x} ${imgPos.y + enhanceYOffset} ${imgPos.z - 0.03}`,
            dur: enhanceAnimationDuration,
            easing: 'easeOutQuad'
          });
          this.img.removeAttribute('animation__imgDehanceScale');
          this.img.setAttribute('animation__imgDehanceScale', {
            property: 'scale',
            from: `2 2 1`,
            to: `1 1 1`,
            dur: enhanceAnimationDuration,
            easing: 'easeOutQuad'
          });

          rightArPos = this.rightAr.getAttribute("position");
          leftArPos = this.leftAr.getAttribute("position");
          this.rightAr.removeAttribute('animation__imgEnhancePosition');
          this.rightAr.setAttribute('animation__imgEnhancePosition', {
            property: 'position',
            from: `${rightArPos.x} ${rightArPos.y} ${rightArPos.z}`,
            to: `${rightArPos.x - 0.725} ${rightArPos.y + enhanceYOffset} ${rightArPos.z - 0.03}`,
            dur: enhanceAnimationDuration,
            easing: 'easeOutQuad'
          });
          this.leftAr.removeAttribute('animation__imgEnhancePosition');
          this.leftAr.setAttribute('animation__imgEnhancePosition', {
            property: 'position',
            from: `${leftArPos.x} ${leftArPos.y} ${leftArPos.z}`,
            to: `${leftArPos.x + 0.725} ${leftArPos.y + enhanceYOffset} ${leftArPos.z - 0.03}`,
            dur: enhanceAnimationDuration,
            easing: 'easeOutQuad'
          });
          
          addClassesForEnhance();
          this.en_X_plane.classList.remove('clickable');
          this.en_X_plane.setAttribute('visible', false);
          turnOnDetailForEnhance();

          this.isPhotoEnhanced = false;
        });

        this.detail.appendChild(this.img);
        this.detail.appendChild(this.rightAr);
        this.detail.appendChild(this.leftAr);
        this.detail.appendChild(this.en_X_plane);
      }

      // plane
      this.plane.setAttribute('geometry', {
        primitive: 'plane',
        width: 2,
        height: 3
      });
      this.plane.setAttribute('material', {
          color: data.backgroundColor,
          opacity: 1,
          transparent: false,
          dithering: false,
          shader: 'flat',
          side: 'double'
      });
      this.plane.setAttribute('position', `0 0 0`);

      // text
      this.text.setAttribute('text', {
        value: data.text,
        font: 'static/fonts/RobotoFlex-msdf.json',
        negate: false,
        shader: 'msdf',
        align: 'left',
        baseline: 'top',
        width: this.plane.getAttribute('geometry').width - text_offset,
        color: data.textColor,
        wrapCount: 36,
        yOffset: 0.3
      });
      this.text.setAttribute('position', {x: 0, y: text_offset/2, z: 0});


      // X button
      this.popup_X_plane.setAttribute('popup-x-button', {});
      this.popup_X_plane.setAttribute('position', '0 -1.6 0.01');
      
      // Audioguide button
      this.audiob = document.createElement('a-entity');
      this.audiob.setAttribute('tts-button', {text: data.text});
      this.audiob.setAttribute('position', '-0.6 -1.3 0.01');
      this.audiob.classList.add('clickable');
      

      // rest of DOM
      this.detail.appendChild(this.plane);
        this.plane.appendChild(this.text);
      this.detail.appendChild(this.popup_X_plane);
      this.detail.appendChild(this.audiob);
      
      el.appendChild(this.detail);

      this.popup_X_plane.addEventListener('click', (evt) => {
        if (evt.target === this.popup_X_plane){
          console.log('clicked X');
          hideDetail();
        }
      })

      this.detail.addEventListener('animationcomplete__appear', () => {
        console.log("Finished appearing detail");
        addClasses();
      });

      this.isInited = true;
    };


    const showDetail = () => {
      if (this.isDetailOpen){
        console.log("Detail already opened!");
        return;
      }
      console.log("Displaying Detail!");
      if (!this.isInited) {
        initializeDetail();
      }

      setTimeout(() => {
        this.detail.setAttribute('visible', 'true');
      }, 0.5 * animationDuration);

      this.detail.removeAttribute('animation__appear');
      this.detail.setAttribute('animation__appear', {
        property: 'position',
        from: `0 ${data.yOffset} 0`,
        to: `${data.moveOffset} ${data.yOffset} 0.6`,
        dur: animationDuration,
        easing: 'easeOutQuad'
      });

      // Get current rotation in Radians
      let current = this.el.object3D.rotation;
      let fromRot = {
        x: THREE.MathUtils.radToDeg(current.x),
        y: THREE.MathUtils.radToDeg(current.y),
        z: THREE.MathUtils.radToDeg(current.z)
      };
      // Compute target rotation 
      let toRot = {
        x: fromRot.x,
        y: fromRot.y + 60,
        z: fromRot.z
      };
      this.detail.removeAttribute('animation__rotate');
      this.detail.setAttribute('animation__rotate', {
        property: 'rotation',
        from: `${fromRot.x} ${fromRot.y} ${fromRot.z}`,
        to: `${toRot.x} ${toRot.y} ${toRot.z}`,
        dur: animationDuration,
        easing: 'easeOutQuad'
      });

      this.isDetailOpen = true;
    }

    const hideDetail = () => {
      if (!this.isDetailOpen){
        console.log("Detail already closed!");
        return;
      }
      console.log("Hiding Detail!");

      removeClasses();

      this.detail.removeAttribute('animation__disappear');
      this.detail.setAttribute('animation__disappear', {
        property: 'position',
        from: `${data.moveOffset} ${data.yOffset} 0.6`,
        to: `0 ${data.yOffset} 0`,
        dur: animationDuration,
        easing: 'easeOutQuad'
      });

      this.detail.removeAttribute('animation__rotate');
      this.detail.setAttribute('animation__rotate', {
        property: 'rotation',
        to: '0 0 0',
        dur: animationDuration,
        easing: 'easeOutQuad',
        isRawProperty: false
      });
      
      // hide before animation ends
      setTimeout(() => {
        this.detail.setAttribute('visible', 'false');
      }, 0.3 * animationDuration);

      this.isDetailOpen = false;
    }

    el.addEventListener('click', (evt) => {
      //ignore clicks on children
      if (evt.target !== el) return;
      console.log('clicked on parent');
      showDetail();
    });
 
  }
});





// controller for generating info banners from override file
AFRAME.registerComponent('infographics-controller', {
    init: function () {
        if (typeof infographicsOverrides === 'undefined') {
            console.warn('infographicsOverrides file is not defined');
            return;
        }

        const sceneEl = this.el;

        console.log("Creating Infographics....");

        Object.entries(infographicsOverrides).forEach(([id, data]) => {
            // main wrapper
            const el = document.createElement('a-entity');

            // position
            if (data.position) {
                el.setAttribute('position', data.position);
            }

            // hover-popup
            el.setAttribute('hover-popup', {
                detailBackgroundColor: data.hoverPopup.detailBackgroundColor,
                detailTextColor: data.hoverPopup.detailTextColor,
                yOffset: data.hoverPopup.yOffset,
                text: data.hoverPopup.text,
                imageCodes: data.hoverPopup.imageCodes.join(','),
                detailText: data.hoverPopup.detailText
            });

            // child entity (sign)
            const sign = document.createElement('a-entity');
            sign.setAttribute('gltf-model', '#sign');
            sign.setAttribute('button-animation', 'gaze_depth: 1.05; click_depth: 0.98');
            sign.setAttribute('scale', '1 0.7 1');
            sign.setAttribute('class', 'clickable');
            sign.setAttribute('rotation', data.rotation);
            sign.setAttribute('auto-center', {});
            el.appendChild(sign);

            // append do scene alebo parent entity
            sceneEl.appendChild(el);

            console.log(`Banner "${id}" created`);
        });
    }
});