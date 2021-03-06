import { AppStateService } from './../../services/appState.service';
import { UserService } from '../../services/domain/user.service';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ZipcodeService } from '../../services/zipcode.service';
import { ToastrService } from 'ngx-toastr';
import { StateService } from '../../services/state.service';
import { SignupService } from '../../services/domain/signup.service';
import { StateDTO } from '../../models/state.dto';
import { UserDTO } from '../../models/user.dto';
import { ProfileService } from '../../services/domain/profile.service';
import { API_CONFIG } from '../../config/api.config';
import { ProfileImageComponent } from './profile-image/profile-image.component';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppStateService } from '../../services/AppState.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private zipcodeService: ZipcodeService,
    private toastrService: ToastrService,
    private stateService: StateService,
    private signupService: SignupService,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private profileService: ProfileService,
    private ngbModal: NgbModal,
    private sanitizer: DomSanitizer,
    private appState: AppStateService
) {
    this.checkIfImageExistAtBucket(this.id);
    this.imageUrl = 'assets/images/avatar-blank.png';
   }

  formGroup: FormGroup;
  zipcode: string;
  states: StateDTO[] = [];
  phone: string;
  maskPhone = '(000) 00000-0000';
  user: UserDTO;
  email: string;
  id: string = this.activatedRoute.snapshot.paramMap.get('id');
  imageUrl: any;

  ngOnInit() {
    this.initForm();
    this.getState();
    this.fillInputs(this.id);
    this.checkIfImageExistAtBucket(this.id);
  }

  checkIfImageExistAtBucket(id: string) {
    this.userService.getImageBucket(id)
      .subscribe(response => {
        this.imageUrl = `${API_CONFIG.bucketBaseUrl}client${id}.jpg`;
        this.profileService.blobToDataURL(response).then(dataUrl => {
          const str: string = dataUrl as string;
          this.imageUrl = this.sanitizer.bypassSecurityTrustUrl(str);
          this.appState.sendEvent(this.id);
        });
      }, error => {
        this.imageUrl = 'assets/images/avatar-blank.png';
      });
  }


  initForm() {
    this.formGroup = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email, Validators.maxLength(80)]],
      name: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      phone: [null, [Validators.required, Validators.minLength(11)]],
      address: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      city: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      state: [null, [Validators.required, Validators.minLength(2)]],
      zipcode: [null, [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
    });
  }

  getZipcode() {
    if (this.zipcode == null) {
      return;
    }
    this.zipcodeService.getZipcodeAPI(this.zipcode)
      .subscribe(response => {
        if (response['erro'] !== true) {
          this.formGroup.controls.address.setValue(response.logradouro + ' - ' + response.bairro);
          this.formGroup.controls.city.setValue(response.localidade);
          this.formGroup.controls.state.setValue(response.uf);
          this.formGroup.controls.zipcode.setValue(response.cep);
        } else {
          this.toastrService.error('O CEP ' +  this.zipcode  + ' não foi encontrado ', 'CEP inválido', {
            timeOut: 3000,
          });
        }
      }, error => {
        this.formGroup.controls.address.setValue(null);
        this.formGroup.controls.city.setValue(null);
        this.formGroup.controls.state.setValue(null);
        this.formGroup.controls.zipcode.setValue(null);
        this.toastrService.error('', 'O CEP não foi encontrado', {
          timeOut: 3000,
        });
      });
  }

  update() {
    this.user = {
      name: this.formGroup.value.name,
      password: null,
      password_confirmation: null,
      email: this.formGroup.value.email,
      client: {
        phone: this.formGroup.value.phone ,
        address: this.formGroup.value.address ,
        city: this.formGroup.value.city ,
        state: this.formGroup.value.state ,
        zipcode: this.formGroup.value.zipcode ,
      }
    };

    this.profileService.update(this.user, this.id)
      .subscribe(response => {
        this.toastrService.success('Seu usuário foi alterado com sucesso !', '', {
          timeOut: 3000,
        });

      }, error => { });
  }

  getState() {
    this.stateService.getStateAPI()
      .subscribe(response => {
        this.states = response;
      }, error => {

      });
  }

  checkPhone() {
    if (this.phone.length === 11) {
      this.maskPhone = '(000) 0000-0000';
    }
  }

  fillInputs(id) {
    this.userService.findOne(id)
      .subscribe(response => {
        this.formGroup.controls.name.setValue(response.name);
        this.formGroup.controls.email.setValue(response.email);

        this.formGroup.controls.address.setValue(response.client.address);
        this.formGroup.controls.city.setValue(response.client.city);
        this.formGroup.controls.state.setValue(response.client.state);
        this.formGroup.controls.zipcode.setValue(response.client.zipcode);
        this.formGroup.controls.phone.setValue(response.client.phone);
      }, error => {

      });
  }

  openModal() {
    this.ngbModal.open(ProfileImageComponent).result.then((response) => {
      this.checkIfImageExistAtBucket(this.id);
    }, (error) => {
      this.checkIfImageExistAtBucket(this.id);
    });
  }

}
