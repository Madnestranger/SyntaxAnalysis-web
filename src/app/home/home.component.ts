import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import * as _ from "lodash";
import { Http } from "@angular/http";
import { ResponseModel } from "./response.model";
import "rxjs/add/operator/map";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"]
})
export class HomeComponent implements OnInit {
  syntaxForm: FormGroup;
  results: ResultModel[];
  descriptions: ResponseModel[];
  showLoader: boolean;
  graphData: any;
  showGraph: boolean;

  constructor(private formBuilder: FormBuilder, private http: Http) {
    this.createForm();
    this.graphData = {
      nodes: [],
      edges: []
      // edges: [{ data: { source: "j", target: "e", faveColor: "#6FB1FC" } }]
    };
  }

  ngOnInit() {}

  createForm() {
    this.syntaxForm = this.formBuilder.group({
      text: ["", Validators.required],
      result: [""]
    });
  }

  parseText() {
    let result = _.cloneDeep(this.syntaxForm.value.text);
    if (result) {
      result = result.split(" ");
    }
    result = result.filter((x: string) => x !== "," && x !== "." && x !== ":" && x !== ";" && x !== " " && x !== "");
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
      if (res.text.indexOf(",") !== -1) {
        this.results[index].text = res.text.replace(",", "");
      }
      if (res.text.indexOf(";") !== -1) {
        this.results[index].text = res.text.replace(";", "");
      }
      if (res.text.indexOf(":") !== -1) {
        this.results[index].text = res.text.replace(":", "");
      }
      if (res.text.indexOf(" ") !== -1) {
        this.results[index].text = res.text.replace(" ", "");
      }
      if (res.text.indexOf(".") !== -1) {
        this.results[index].is_end = true;
        this.results[index].order = sentenceCounter;
        sentenceCounter++;
        if (this.results.length >= index + 2) {
          this.results[index + 1].is_start = true;
          this.results[index + 1].order = sentenceCounter;
        }
        this.results[index].text = res.text.replace(".", "");
      }
    });

    this.getInfoAboutText();
  }

  getInfoAboutText() {
    this.showLoader = true;
    this.showGraph = false;
    this.http.post(`api/values`, { text: this.results.map((res: any) => res.text.toLowerCase().trim()) }).subscribe(
      (res: any) => {
        this.descriptions = res.json();
        this.showLoader = false;
        this.descriptions.forEach((desc: ResponseModel, index: number) => {
          if (this.results[index]) {
            this.results[index].part = desc.part;
            this.results[index].comment = desc.comment;
            this.results[index].part_of_speech = this.returnPartOfSpeechFullDescription(desc.part_of_speech);
          }
        });
        console.log(this.results);
        this.graphData.nodes = [{ data: { id: "s", name: "S", faveColor: this.getRandomColor(), faveShape: "rectangle" } }];
        this.findSubjects();
        this.showGraph = true;
      },
      () => {
        this.showLoader = false;
      }
    );
  }

  findSubjects() {
    this.results.forEach((x: ResultModel, index: number) => {
      if (x.part && x.part.toLowerCase().indexOf("іменник") >= 0) {
        const adjectives = this.checkAdjectiveGroupNearTheSubject(index);
        if (adjectives && adjectives.length > 0) {
          this.graphData.nodes.push({
            data: {id: x.text + " NP", name: "NP", faveColor: this.getRandomColor(), faveShape: "rectangle"}
          });
          this.graphData.nodes.push({
            data: {id: x.text, name: x.text, faveColor: this.getRandomColor(), faveShape: "rectangle"}
          });
          this.graphData.nodes.push({
            data: {id: x.text + " AP", name: "AP", faveColor: this.getRandomColor(), faveShape: "rectangle"}
          });
          this.graphData.edges.push({
            data: {source: "s", target: x.text + " NP", faveColor: this.getRandomColor()}
          });
          this.graphData.edges.push({
            data: {source: x.text + " NP", target: x.text + " AP", faveColor: this.getRandomColor()}
          });
          this.graphData.edges.push({
            data: {source: x.text + " NP", target: x.text, faveColor: this.getRandomColor()}
          });
          adjectives.forEach((y: ResultModel) => {
            this.graphData.nodes.push({
              data: {id: y.text, name: y.text, faveColor: this.getRandomColor(), faveShape: "rectangle"}
            });
            this.graphData.edges.push({
              data: {source: x.text + " AP", target: y.text, faveColor: this.getRandomColor()}
            });
          });
        }
      }
    });
  }

  checkAdjectiveGroupNearTheSubject(index: number) {
    const adjectiveGroup: ResultModel[] = [];
    if (index >= 1 && this.results[index - 1] && this.results[index - 1].part
      && this.results[index - 1].part.toLowerCase().indexOf("прикметник") >= 0) {
      adjectiveGroup.push(this.results[index - 1]);
      index--;
      index--;
      while (index >= 0) {
        if (this.results[index] && this.results[index].part.toLowerCase().indexOf("сполучник") >= 0) {
          index--;
          continue;
        }
        if (this.results[index] && this.results[index].part.toLowerCase().indexOf("прикметник") >= 0) {
          adjectiveGroup.push(this.results[index]);
        }
        index--;
      }
    }
    return adjectiveGroup;
  }

  getRandomColor() {
    const colors = ["#6FB1FC", "#EDA1ED", "#86B342", "#F5A45D"];
    return colors[this.getRandomArbitrary(0, colors.length - 1)];
  }

  getRandomArbitrary (min: number, max: number) {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    rand = Math.round(rand);
    return rand;
  }

  returnPartOfSpeechFullDescription(shortDescription: string): string {
    let result = "";

    if (!shortDescription) {
      return result;
    }

    // mostly words format, i.e. "Н s m"
    // first symbol
    if (shortDescription.charAt(0) === "Н") {
      result += "Називний відмінок, ";
    }
    if (shortDescription.charAt(0) === "Р") {
      result += "Родовий відмінок, ";
    }
    if (shortDescription.charAt(0) === "Д") {
      result += "Давальний відмінок, ";
    }
    if (shortDescription.charAt(0) === "З") {
      result += "Знахідний відмінок, ";
    }
    if (shortDescription.charAt(0) === "О") {
      result += "Орудний відмінок, ";
    }
    if (shortDescription.charAt(0) === "М") {
      result += "Місцевий відмінок, ";
    }
    if (shortDescription.charAt(0) === "К") {
      result += "Кличний відмінок, ";
    }

    // third symbol
    if (shortDescription.charAt(2) === "s" && shortDescription.charAt(1) === " ") {
      result += "однина";
    }
    if (shortDescription.charAt(2) === "p" && shortDescription.charAt(1) === " ") {
      result += "множина";
    }
    if (shortDescription.charAt(2) === "m" && shortDescription.charAt(1) === " ") {
      result += "чоловічий рід";
    }
    if (shortDescription.charAt(2) === "f" && shortDescription.charAt(1) === " ") {
      result += "жіночий рід";
    }

    // fifth symbol
    if (shortDescription.charAt(4) === "m" && shortDescription.charAt(3) === " ") {
      result += ", чоловічий рід";
    }
    if (shortDescription.charAt(4) === "f" && shortDescription.charAt(3) === " ") {
      result += ", жіночий рід";
    }
    if (shortDescription.charAt(4) === "n" && shortDescription.charAt(3) === " ") {
      result += ", середній рід";
    }

    // verbs formatting
    // first identified
    if (shortDescription.indexOf("imp") >= 0) {
      result += "imperfect, ";
    }
    if (shortDescription.indexOf("fut") >= 0) {
      result += "Майбутній час, ";
    }
    if (shortDescription.indexOf("fut_p") >= 0) {
      result += "Майбутній час (p), ";
    }
    if (shortDescription.indexOf("prs") >= 0) {
      result += "Теперішній час, ";
    }
    if (shortDescription.indexOf("pst") >= 0) {
      result += "Минулий час, ";
    }

    // second identified
    if (shortDescription.indexOf("1ps") >= 0) {
      result += "першої особи";
    }
    if (shortDescription.indexOf("2ps") >= 0) {
      result += "другої особи";
    }
    if (shortDescription.indexOf("3ps") >= 0) {
      result += "третьої особи";
    }
    if (shortDescription.indexOf("act") >= 0) {
      result += "act";
    }
    if (shortDescription.indexOf("psv") >= 0) {
      result += "psv";
    }
    if (shortDescription.indexOf("get") >= 0) {
      result += "герундій";
    }

    // third identified
    if (shortDescription.indexOf("sing") >= 0) {
      result += ", однини";
    }
    if (shortDescription.indexOf("plur") >= 0) {
      result += ", множини";
    }
    if (shortDescription.indexOf("msc") >= 0) {
      result += ", msc";
    }
    if (shortDescription.indexOf("fem") >= 0) {
      result += ", жіночого роду";
    }
    if (shortDescription.indexOf("nwt") >= 0) {
      result += ", nwt";
    }

    // Exceptions
    if (shortDescription === "inf") {
      result = "Інфінітив";
    }
    if (shortDescription === "impers") {
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
