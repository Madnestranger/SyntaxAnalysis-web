import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as _ from 'lodash';
import {Http} from "@angular/http";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  syntaxForm: FormGroup;
  results: string[];

  constructor(private formBuilder: FormBuilder,
              private http: Http) {
    this.createForm();
    this.getData();
  }

  ngOnInit() {
  }

  createForm() {
    this.syntaxForm = this.formBuilder.group({
      text: ['', Validators.required],
      result: ['']
    });
  }

  parseText() {
    let result = _.cloneDeep(this.syntaxForm.value.text);
    if (result) {
      result = result.split(' ');
    }
    result = result.filter((x: string) => x !== ',' && x !== '.' && x !== ':' && x !== ';' && x !== ' ');
    result.forEach((res: string, index: number) => {
      if (res.indexOf(',') !== -1) {
        result[index] = res.replace(',', '');
      }
      if (res.indexOf('.') !== -1) {
        result[index] = res.replace('.', '');
      }
      if (res.indexOf(';') !== -1) {
        result[index] = res.replace(';', '');
      }
      if (res.indexOf(':') !== -1) {
        result[index] = res.replace(':', '');
      }
      if (res.indexOf(' ') !== -1) {
        result[index] = res.replace(' ', '');
      }
    });
    this.results = result;
  }

  getData() {
    this.http
      .get(`api/values`)
      .subscribe((res: any) => {
        console.log(res.json());
      });
  }

}
