import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as _ from 'lodash';
import {Http} from "@angular/http";
import {ResponseModel} from "./response.model";
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  syntaxForm: FormGroup;
  results: ResultModel[];
  descriptions: ResponseModel[];
  showLoader: boolean;
  findSubjectShift = 3;
  config: Config[];

  constructor(private formBuilder: FormBuilder,
              private http: Http) {
    this.createForm();
  }

  ngOnInit() {
    const xhr = new XMLHttpRequest();
    const self = this;
    xhr.open('GET', 'assets/schema.json', true);
    xhr.responseType = 'blob';
    xhr.onload = function() {
      if (this.status === 200) {
        const file = new File([this.response], 'temp');
        const fileReader = new FileReader();
        fileReader.addEventListener('load', function(data: any) {
          self.config = JSON.parse(data.target.result);
          console.log(self.config);
        });
        fileReader.readAsText(file);
      }
    };
    xhr.send();
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
    this.results = result.map((res: string) => {
      return {
        text: res,
        part: "",
        comment: "",
        part_of_speech: ""
      };
    });
    let sentenceCounter = 1;
    this.results.forEach((res: ResultModel, index: number) => {
      if (index === 0) {
        this.results[0].is_start = true;
        this.results[0].order = sentenceCounter;
      }
      if (res.text.indexOf(',') !== -1) {
        this.results[index].text = res.text.replace(',', '');
      }
      if (res.text.indexOf(';') !== -1) {
        this.results[index].text = res.text.replace(';', '');
      }
      if (res.text.indexOf(':') !== -1) {
        this.results[index].text = res.text.replace(':', '');
      }
      if (res.text.indexOf(' ') !== -1) {
        this.results[index].text = res.text.replace(' ', '');
      }
      if (res.text.indexOf('.') !== -1) {
        this.results[index].is_end = true;
        this.results[index].order = sentenceCounter;
        sentenceCounter++;
        if (this.results.length >= index + 2) {
          this.results[index + 1].is_start = true;
          this.results[index + 1].order = sentenceCounter;
        }
        this.results[index].text = res.text.replace('.', '');
      }
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

        // Second Algorithm due to schema
        this.config.forEach((x: Config) => {
          if (this.results.length === x.data.schema.length) { // check for similar schema length
            for (let i = 0; i < this.results.length; i++) {
              if (x.data.schema[i].split(" ").length > 1) {
                const syntaxDescription = x.data.schema[i].split(" "); // 0 - частина мови, 1 - відмінок
                if (this.results[i].part.toLowerCase().indexOf(syntaxDescription[0]) >= 0 &&
                this.results[i].part_of_speech.toLowerCase().indexOf(syntaxDescription[1]) >= 0) {
                  this.setValue(x.data.syntax[i], i);
                }
              } else {
                if (x.data.schema[i] === "") {
                  this.results[i].is_obstavyna = true;
                  continue;
                }
                console.log(this.results[i].part);
                console.log(x.data.schema[i]);
                console.log(this.results[i].part.toLowerCase());
                console.log(this.results[i].part.toLowerCase().indexOf(x.data.schema[i]));
                if (this.results[i].part && this.results[i].part.toLowerCase().indexOf(x.data.schema[i]) >= 0) {
                 this.setValue(x.data.syntax[i], i);
                }
              }
            }
          }
        });

        // First Algorithm Of Getting Info From Subject
        // this.results.forEach((result: ResultModel, index: number) => {
        //   if (result.part && result.part.toLowerCase().indexOf("прикметник") === 0) {
        //     result.is_oznachennia = true;
        //   }
        //
        //   if (result.part && result.part_of_speech &&
        //     ((result.part.toLowerCase().indexOf("іменник") >= 0 && result.part_of_speech.toLowerCase().indexOf("називний") >= 0) ||
        //     (result.part.toLowerCase().indexOf("іменник") >= 0 && result.part_of_speech.toLowerCase().indexOf("відмінок") === -1) ||
        //     (result.part.toLowerCase().indexOf("займенник") >= 0 && result.part_of_speech.toLowerCase().indexOf("називний") >= 0))) {
        //     result.is_pidmet = true;
        //     this.checkSubjectSiblings(index);
        //   }
        // });

        // this.results.forEach((x: ResultModel) => {
        //   if (!x.is_pidmet && !x.is_prysudok && !x.is_oznachennia) {
        //     x.is_obstavyna = true;
        //   }
        // });
      }, () => {
        this.showLoader = false;
      });
  }

  setValue(key: string, i: number) {
    if (key === "підмет") {
      this.results[i].is_pidmet = true;
    }
    if (key === "присудок") {
      this.results[i].is_prysudok = true;
    }
    if (key === "означення") {
      this.results[i].is_oznachennia = true;
    }
    if (key === "обставина") {
      this.results[i].is_obstavyna = true;
    }
  }

  checkSubjectSiblings(index: number) {
    let from = index - this.findSubjectShift;
    if (from < 0) {
      from = 0;
    }
    const to = index + this.findSubjectShift;
    for (let i = from; i <= to; i++) {
      if (this.results[i] && this.results[i].part && this.results[i].part.toLowerCase().indexOf("дієслово") >= 0) {
        this.results[i].is_prysudok = true;
      }
    }
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
    if (shortDescription.charAt(2) === 's' && shortDescription.charAt(1) === " ") {
      result += 'однина';
    }
    if (shortDescription.charAt(2) === 'p' && shortDescription.charAt(1) === " ") {
      result += 'множина';
    }
    if (shortDescription.charAt(2) === 'm' && shortDescription.charAt(1) === " ") {
      result += 'чоловічий рід';
    }
    if (shortDescription.charAt(2) === 'f' && shortDescription.charAt(1) === " ") {
      result += 'жіночий рід';
    }

    // fifth symbol
    if (shortDescription.charAt(4) === 'm' && shortDescription.charAt(3) === " ") {
      result += ', чоловічий рід';
    }
    if (shortDescription.charAt(4) === 'f' && shortDescription.charAt(3) === " ") {
      result += ', жіночий рід';
    }
    if (shortDescription.charAt(4) === 'n' && shortDescription.charAt(3) === " ") {
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

class ResultModel {
  text: string;
  part: string;
  comment: string;
  part_of_speech: string;
  order?: number;
  is_start?: boolean;
  is_end?: boolean;
  is_pidmet?: boolean;
  is_prysudok?: boolean;
  is_oznachennia?: boolean;
  is_obstavyna?: boolean;
}

class Config {
  index: number;
  data: ConfigData;
}

class ConfigData {
  schema: string[];
  syntax: string[];
}
