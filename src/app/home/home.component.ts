import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as _ from 'lodash';
import {Http} from "@angular/http";
import {ResponseModel} from "./response.model";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  syntaxForm: FormGroup;
  results: any;
  descriptions: any;
  showLoader: boolean;

  constructor(private formBuilder: FormBuilder,
              private http: Http) {
    this.createForm();
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
    result = result.filter((x: string) => x !== ',' && x !== '.' && x !== ':' && x !== ';' && x !== ' ' && x !== '');
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
    this.results = result.map((res: string) => {
      return {
        text: res,
        part: "",
        comment: "",
        part_of_speech: ""
      };
    });
    this.getInfoAboutText();
  }

  getInfoAboutText() {
    this.showLoader = true;
    this.http
      .post(`api/values`, {text: this.results.map((res: any) => res.text.toLowerCase().trim())})
      .subscribe((res: any) => {
        this.descriptions = res.json();
        this.showLoader = false;
        this.descriptions.forEach((desc: ResponseModel, index: number) => {
          if (this.results[index]) {
            this.results[index].part = desc.part;
            this.results[index].comment = desc.comment;
            this.results[index].part_of_speech = this.returnPartOfSpeechFullDescription(desc.part_of_speech);
          }
        });
      }, () => {
        this.showLoader = false;
      });
  }

  returnPartOfSpeechFullDescription(shortDescription: string): string {
    let result = '';

    if (!shortDescription) {
      return result;
    }

    // mostly words format, i.e. "Н s m"
    // first symbol
    if (shortDescription.charAt(0) === 'Н') {
      result += 'Називний відмінок, ';
    }
    if (shortDescription.charAt(0) === 'Р') {
      result += 'Родовий відмінок, ';
    }
    if (shortDescription.charAt(0) === 'Д') {
      result += 'Давальний відмінок, ';
    }
    if (shortDescription.charAt(0) === 'З') {
      result += 'Знахідний відмінок, ';
    }
    if (shortDescription.charAt(0) === 'О') {
      result += 'Орудний відмінок, ';
    }
    if (shortDescription.charAt(0) === 'М') {
      result += 'Місцевий відмінок, ';
    }
    if (shortDescription.charAt(0) === 'К') {
      result += 'Кличний відмінок, ';
    }

    // third symbol
    if (shortDescription.charAt(2) === 's') {
      result += 'однина';
    }
    if (shortDescription.charAt(2) === 'p') {
      result += 'множина';
    }
    if (shortDescription.charAt(2) === 'm') {
      result += 'чоловічий рід';
    }
    if (shortDescription.charAt(2) === 'f') {
      result += 'жіночий рід';
    }

    // fifth symbol
    if (shortDescription.charAt(4) === 'm') {
      result += ', чоловічий рід';
    }
    if (shortDescription.charAt(4) === 'f') {
      result += ', жіночий рід';
    }
    if (shortDescription.charAt(4) === 'n') {
      result += ', середній рід';
    }

    // verbs formatting
    // first identified
    if (shortDescription.indexOf('imp') >= 0) {
      result += 'imperfect, ';
    }
    if (shortDescription.indexOf('fut') >= 0) {
      result += 'Майбутній час, ';
    }
    if (shortDescription.indexOf('fut_p') >= 0) {
      result += 'Майбутній час (p), ';
    }
    if (shortDescription.indexOf('prs') >= 0) {
      result += 'Теперішній час, ';
    }
    if (shortDescription.indexOf('pst') >= 0) {
      result += 'Минулий час, ';
    }

    // second identified
    if (shortDescription.indexOf('1ps') >= 0) {
      result += 'першої особи';
    }
    if (shortDescription.indexOf('2ps') >= 0) {
      result += 'другої особи';
    }
    if (shortDescription.indexOf('3ps') >= 0) {
      result += 'третьої особи';
    }
    if (shortDescription.indexOf('act') >= 0) {
      result += 'act';
    }
    if (shortDescription.indexOf('psv') >= 0) {
      result += 'psv';
    }
    if (shortDescription.indexOf('get') >= 0) {
      result += 'герундій';
    }

    // third identified
    if (shortDescription.indexOf('sing') >= 0) {
      result += ', однини';
    }
    if (shortDescription.indexOf('plur') >= 0) {
      result += ', множини';
    }
    if (shortDescription.indexOf('msc') >= 0) {
      result += ', msc';
    }
    if (shortDescription.indexOf('fem') >= 0) {
      result += ', жіночого роду';
    }
    if (shortDescription.indexOf('nwt') >= 0) {
      result += ', nwt';
    }

    // Exceptions
    if (shortDescription === 'inf') {
      result = "Інфінітив";
    }
    if (shortDescription === 'impers') {
      result = "Impers";
    }

    return result;
  }

}
